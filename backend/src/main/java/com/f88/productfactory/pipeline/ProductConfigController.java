package com.f88.productfactory.pipeline;

import com.f88.productfactory.structure.AnswerSlot;
import com.f88.productfactory.structure.AnswerSlotRepository;
import com.f88.productfactory.structure.Block;
import com.f88.productfactory.structure.BlockRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

/**
 * Product Config (Lớp III — Pipeline).
 *
 * Prototype: màn list `config` + view riêng `configForm` ("editor" fragment theo bối cảnh).
 * Xác nhận qua bundler JS: click bất kỳ dòng nào trong list đều gọi `this.go('configForm')`
 * KHÔNG mang id dòng — `configForm` luôn hiển thị đúng 1 bộ dữ liệu cứng "CFG-0042" (từ
 * `configBase()`/state khởi tạo tĩnh `cfgCtx`/`cfgSlot`/`cfgDraft`). Giống bài học Product
 * Template: đây KHÔNG phải per-row detail thật, mà là demo tĩnh của 1 config duy nhất.
 *
 * Quyết định (nhất quán với Template): dựng `/{code}/detail` là màn XEM (không sửa) fragment
 * thật của TỪNG config theo code — không copy state tĩnh của prototype. Chỉ CFG-0042 có seed
 * fragment đầy đủ (15 dòng); các config khác sẽ hiện "chưa có fragment nào" — đúng thực trạng.
 *
 * Cột "NGƯỜI DUYỆT" của prototype list KHÔNG có cột nguồn trong `product_config` → bỏ (quy tắc vàng).
 */
@RestController
@RequestMapping("/api/product-configs")
public class ProductConfigController {

    private final ProductConfigRepository repo;
    private final ProductTemplateRepository templateRepo;
    private final FragmentRepository fragmentRepo;
    private final SelectorScopeRepository scopeRepo;
    private final BlockRepository blockRepo;
    private final AnswerSlotRepository slotRepo;

    public ProductConfigController(ProductConfigRepository repo,
                                   ProductTemplateRepository templateRepo,
                                   FragmentRepository fragmentRepo,
                                   SelectorScopeRepository scopeRepo,
                                   BlockRepository blockRepo,
                                   AnswerSlotRepository slotRepo) {
        this.repo = repo;
        this.templateRepo = templateRepo;
        this.fragmentRepo = fragmentRepo;
        this.scopeRepo = scopeRepo;
        this.blockRepo = blockRepo;
        this.slotRepo = slotRepo;
    }

    /**
     * Danh sách Product Config (làm giàu):
     * mỗi phần tử = { code, name, fromTemplateCode, templateName, fragmentCount, status }.
     */
    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
        Page<ProductConfig> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ProductConfig c : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", c.getCode());
            row.put("name", c.getName());
            row.put("fromTemplateCode", c.getFromTemplateCode());
            row.put("templateName", templateRepo.findById(c.getFromTemplateCode())
                    .map(ProductTemplate::getName).orElse(c.getFromTemplateCode()));
            row.put("fragmentCount", fragmentRepo.countByConfigCode(c.getCode()));
            row.put("status", c.getStatus());
            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /**
     * Chi tiết Product Config (XEM, không sửa) — fragment thật gom theo (block, slot), mỗi
     * slot có danh sách fragment theo bối cảnh (scope), sắp theo độ ưu tiên ghi đè tăng dần:
     * { config:{code,name,fromTemplateCode,status}, templateName,
     *   slots:[{blockId,blockName,slotCode,slotName,fragments:[{scopeCode,scopeName,priority,scopeValue,value,isWarning,validationMsg}]}] }.
     */
    @GetMapping("/{code}/detail")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable String code) {
        return repo.findById(code).map(c -> {
            Map<String, Object> body = new LinkedHashMap<>();
            Map<String, Object> configMeta = new LinkedHashMap<>();
            configMeta.put("code", c.getCode());
            configMeta.put("name", c.getName());
            configMeta.put("fromTemplateCode", c.getFromTemplateCode());
            configMeta.put("status", c.getStatus());
            body.put("config", configMeta);

            body.put("templateName", templateRepo.findById(c.getFromTemplateCode())
                    .map(ProductTemplate::getName).orElse(c.getFromTemplateCode()));

            List<Fragment> fragments = fragmentRepo.findByConfigCode(code);

            // Thứ tự (block_id, slot_code) theo lần xuất hiện đầu tiên (giữ layout seed).
            LinkedHashSet<String> slotKeys = new LinkedHashSet<>();
            for (Fragment f : fragments) slotKeys.add(f.getBlockId() + "" + f.getSlotCode());

            List<Map<String, Object>> slots = new ArrayList<>();
            for (String key : slotKeys) {
                String[] parts = key.split("", 2);
                String blockId = parts[0], slotCode = parts[1];

                Block block = blockRepo.findById(blockId).orElse(null);
                AnswerSlot slot = slotRepo.findByBlockId(blockId).stream()
                        .filter(s -> s.getCode().equals(slotCode)).findFirst().orElse(null);

                Map<String, Object> sm = new LinkedHashMap<>();
                sm.put("blockId", blockId);
                sm.put("blockName", block != null ? block.getName() : blockId);
                sm.put("slotCode", slotCode);
                sm.put("slotName", slot != null ? slot.getName() : slotCode);

                List<Map<String, Object>> slotFragments = new ArrayList<>();
                for (Fragment f : fragments) {
                    if (!f.getBlockId().equals(blockId) || !f.getSlotCode().equals(slotCode)) continue;
                    SelectorScope scope = scopeRepo.findById(f.getScopeCode()).orElse(null);
                    Map<String, Object> fm = new LinkedHashMap<>();
                    fm.put("scopeCode", f.getScopeCode());
                    fm.put("scopeName", scope != null ? scope.getName() : f.getScopeCode());
                    int priority = scope != null ? scope.getPriority() : 0;
                    fm.put("priority", priority);
                    fm.put("scopeValue", f.getScopeValue());
                    fm.put("value", f.getValue());
                    fm.put("isWarning", f.isWarning());
                    fm.put("validationMsg", f.getValidationMsg());
                    slotFragments.add(fm);
                }
                slotFragments.sort(Comparator.comparingInt(m -> ((Number) m.get("priority")).intValue()));
                sm.put("fragments", slotFragments);

                slots.add(sm);
            }
            body.put("slots", slots);

            return ResponseEntity.ok(body);
        }).orElse(ResponseEntity.notFound().build());
    }
}
