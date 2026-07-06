package com.f88.productfactory.application.service.pipeline;

import com.f88.productfactory.domain.model.attribute.Attribute;
import com.f88.productfactory.domain.model.attribute.AttributeConstraint;
import com.f88.productfactory.domain.model.pipeline.Fragment;
import com.f88.productfactory.domain.model.pipeline.PatternBlock;
import com.f88.productfactory.domain.model.pipeline.ProductConfig;
import com.f88.productfactory.domain.model.pipeline.ProductTemplate;
import com.f88.productfactory.domain.model.pipeline.SelectorScope;
import com.f88.productfactory.domain.model.pipeline.TemplateFrame;
import com.f88.productfactory.domain.model.structure.AnswerSlot;
import com.f88.productfactory.domain.model.structure.Block;
import com.f88.productfactory.domain.model.structure.DataType;
import com.f88.productfactory.domain.repository.attribute.AttributeConstraintRepository;
import com.f88.productfactory.domain.repository.attribute.AttributeRepository;
import com.f88.productfactory.domain.repository.pipeline.FragmentRepository;
import com.f88.productfactory.domain.repository.pipeline.PatternBlockRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductConfigRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductTemplateRepository;
import com.f88.productfactory.domain.repository.pipeline.SelectorScopeRepository;
import com.f88.productfactory.domain.repository.pipeline.TemplateFrameRepository;
import com.f88.productfactory.domain.repository.structure.AnswerSlotRepository;
import com.f88.productfactory.domain.repository.structure.BlockRepository;
import com.f88.productfactory.domain.repository.structure.DataTypeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/**
 * Product Config (Lớp III — Pipeline) — "Cấu hình Product Config" (Config Fragment builder +
 * Resolution preview), trích đúng markup `isConfigForm` của prototype (bundler dòng ~686-837).
 *
 * Prototype hardcode 1 config duy nhất ("CFG-0042", `configBase()`/`configModel()`) nhưng dữ
 * liệu đó khớp CHÍNH XÁC seed thật (15/18 fragment — 15 khớp verbatim bundler, 3 dòng bổ sung
 * cho slot bắt buộc thật mà bundler không mô phỏng, xem ghi chú seed — đúng block/slot/scope/
 * giá trị/is_warning). Vì vậy dựng detail() = XEM (không sửa) đúng cấu trúc builder
 * này cho TỪNG config theo code thật, không copy state tĩnh.
 *
 * Block "đang áp dụng" cho 1 config: ưu tiên suy TRỰC TIẾP từ chính `fragment` thật của config
 * đó (config đã cấu hình block nào thì hiện block đó) — khớp đúng bộ 6 block của prototype cho
 * CFG-0042 (Bên tham gia/Hạn mức/Lãi suất/Tài sản đảm bảo/Trả nợ/**Phạt & Quá hạn**, dù Template
 * TPL-003 KHÔNG có `template_frame` cho BLK_PENALTY; và loại **BLK_BILLING** dù Template có
 * frame cho nó — vì CFG-0042 chưa cấu hình fragment nào ở đó). Chỉ khi config CHƯA có fragment
 * nào (rỗng) mới dùng khung block từ `template_frame` làm bộ khung trống để điền (giữ hành vi
 * hữu ích cho 6 config khác chưa cấu hình gì, thay vì hiện sidebar trống trơn).
 *
 * SỬA LỖI DỮ LIỆU MẪU (phát hiện lúc dựng màn này): `product_config.from_template_code` của
 * CFG-0042 từng trỏ nhầm sang `TPL-001` (KHÔNG có `template_frame` nào). Đã sửa lại
 * `V2__seed.sql` thành `TPL-003` — khớp đúng cấu trúc 6 block mà 15 fragment thật của CFG-0042
 * dùng, và khớp `version_entry` lịch sử ("Khởi tạo Config từ Template TPL-003 v1.2").
 *
 * Chip "RÀNG BUỘC" trên slot lấy `attribute_constraint.expression` (ưu tiên kind='regulatory',
 * rồi tới constraint đầu tiên có expression) — khớp thật `attribute_constraint` (Lớp II).
 * Banner "Kiểm tra ràng buộc Attribute" liệt kê fragment có `is_warning=true` — cột này đã có
 * sẵn, được ghi thật trong seed (không cần tính lại như bundler's `cfgValidate()` runtime).
 *
 * Thuật toán "Resolution" (chọn fragment thắng theo ngữ cảnh People/Place/Time) chạy ở
 * FRONTEND — đây là phép chọn xác định (deterministic selection) trên dữ liệu đã trả đủ, không
 * phải phép TÍNH TOÁN cần backend (khác Simulation Engine — phần 10% duy nhất tính toán thật).
 * `placeOptions`/`timeOptions` suy ra thật từ token phân biệt trong `fragment.scope_value` của
 * chính config này (không bịa thêm vùng miền không có dữ liệu thật); `peopleOptions` cố định
 * Standard/Loyalty/VIP (khớp `customer_segment.tier`/`CFG_PRIORITY` và tên hiển thị thật
 * "Khách hàng thân thiết (−0,5%/tháng)"/"Khách hàng VIP (−0,3%/tháng)").
 */
@Service
public class ProductConfigService {

    /** Ký tự phân tách block_id/slot_code khi ghép khóa — không xuất hiện trong 2 giá trị này. */
    private static final char SEP = '|';

    private final ProductConfigRepository repo;
    private final ProductTemplateRepository templateRepo;
    private final PatternBlockRepository patternBlockRepo;
    private final TemplateFrameRepository templateFrameRepo;
    private final FragmentRepository fragmentRepo;
    private final SelectorScopeRepository scopeRepo;
    private final BlockRepository blockRepo;
    private final AnswerSlotRepository slotRepo;
    private final AttributeRepository attributeRepo;
    private final AttributeConstraintRepository constraintRepo;
    private final DataTypeRepository dataTypeRepo;

    public ProductConfigService(ProductConfigRepository repo,
                                ProductTemplateRepository templateRepo,
                                PatternBlockRepository patternBlockRepo,
                                TemplateFrameRepository templateFrameRepo,
                                FragmentRepository fragmentRepo,
                                SelectorScopeRepository scopeRepo,
                                BlockRepository blockRepo,
                                AnswerSlotRepository slotRepo,
                                AttributeRepository attributeRepo,
                                AttributeConstraintRepository constraintRepo,
                                DataTypeRepository dataTypeRepo) {
        this.repo = repo;
        this.templateRepo = templateRepo;
        this.patternBlockRepo = patternBlockRepo;
        this.templateFrameRepo = templateFrameRepo;
        this.fragmentRepo = fragmentRepo;
        this.scopeRepo = scopeRepo;
        this.blockRepo = blockRepo;
        this.slotRepo = slotRepo;
        this.attributeRepo = attributeRepo;
        this.constraintRepo = constraintRepo;
        this.dataTypeRepo = dataTypeRepo;
    }

    /**
     * Danh sách Product Config (làm giàu):
     * mỗi phần tử = { code, name, fromTemplateCode, templateName, fragmentCount, status }.
     */
    public Page<Map<String, Object>> list(Pageable pageable) {
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

    private static String key(String blockId, String slotCode) {
        return blockId + SEP + slotCode;
    }

    /**
     * Chi tiết Product Config — pixel-perfect với builder "Cấu hình Product Config" prototype:
     * { config, templateName, completeness:{reqFilled,totalReq,pct},
     *   sidebar:[{blockId,blockName,reqFilled,reqTotal,slots:[{code,name,required,filled}]}],
     *   missingRequired:[{blockId,slotCode,slotName}],
     *   constraintIssues:[{slotCode,slotName,scopeLabel,scopeValue,value,message}],
     *   slots:{ [slotCode]: {code,name,blockId,blockName,required,attributeCode,attributeName,
     *            dataTypeName,constraintText,inheritedFrameValue,fragmentCount,
     *            fragments:[{scopeCode,scopeName,priority,scopeValue,value,isWarning,validationMsg}]} },
     *   peopleOptions, placeOptions, timeOptions }
     */
    public Optional<Map<String, Object>> detail(String code) {
        return repo.findById(code).map(cfg -> {
            ProductTemplate tpl = templateRepo.findById(cfg.getFromTemplateCode()).orElse(null);
            String patternCode = tpl != null ? tpl.getFromPatternCode() : null;

            Map<String, String> frameByKey = new LinkedHashMap<>();
            Set<String> frameBlocks = new LinkedHashSet<>();
            if (tpl != null) {
                for (TemplateFrame f : templateFrameRepo.findByTemplateCode(tpl.getCode())) {
                    frameByKey.put(key(f.getBlockId(), f.getSlotCode()), f.getFrameValue());
                    frameBlocks.add(f.getBlockId());
                }
            }

            Map<String, List<Fragment>> fragsByKey = new LinkedHashMap<>();
            Set<String> fragBlocks = new LinkedHashSet<>();
            for (Fragment f : fragmentRepo.findByConfigCode(code)) {
                fragsByKey.computeIfAbsent(key(f.getBlockId(), f.getSlotCode()), k -> new ArrayList<>()).add(f);
                fragBlocks.add(f.getBlockId());
            }

            // Config đã cấu hình fragment nào → dùng đúng bộ block đó (dữ liệu thật của chính
            // config). Config còn trống → tạm dùng khung block của Template làm bộ khung để điền.
            Set<String> activeBlocks = fragBlocks.isEmpty() ? frameBlocks : fragBlocks;

            List<Map<String, Object>> sidebar = new ArrayList<>();
            List<Map<String, Object>> missingRequired = new ArrayList<>();
            List<Map<String, Object>> constraintIssues = new ArrayList<>();
            Map<String, Object> slotsOut = new LinkedHashMap<>();
            Set<String> placeOptions = new LinkedHashSet<>();
            Set<String> timeOptions = new LinkedHashSet<>();
            int totalReq = 0, reqFilled = 0;

            if (patternCode != null) {
                for (PatternBlock pb : patternBlockRepo.findByPatternCodeOrderByPosition(patternCode)) {
                    if (!activeBlocks.contains(pb.getBlockId())) continue;
                    Block block = blockRepo.findById(pb.getBlockId()).orElse(null);

                    List<Map<String, Object>> slotSummaries = new ArrayList<>();
                    int blockReqTotal = 0, blockReqFilled = 0;

                    for (AnswerSlot slot : slotRepo.findByBlockId(pb.getBlockId())) {
                        String k = key(pb.getBlockId(), slot.getCode());
                        List<Fragment> frags = fragsByKey.getOrDefault(k, List.of());
                        boolean filled = !frags.isEmpty();

                        if (slot.isRequired()) {
                            blockReqTotal++;
                            totalReq++;
                            if (filled) { blockReqFilled++; reqFilled++; }
                        }

                        Map<String, Object> ss = new LinkedHashMap<>();
                        ss.put("code", slot.getCode());
                        ss.put("name", slot.getName());
                        ss.put("required", slot.isRequired());
                        ss.put("filled", filled);
                        slotSummaries.add(ss);

                        if (slot.isRequired() && !filled) {
                            Map<String, Object> mr = new LinkedHashMap<>();
                            mr.put("blockId", pb.getBlockId());
                            mr.put("slotCode", slot.getCode());
                            mr.put("slotName", slot.getName());
                            missingRequired.add(mr);
                        }

                        Attribute attr = attributeRepo.findById(slot.getAttributeCode()).orElse(null);
                        DataType dt = attr != null ? dataTypeRepo.findById(attr.getDataTypeCode()).orElse(null) : null;
                        List<AttributeConstraint> constraints = attr != null
                                ? constraintRepo.findByAttributeCode(attr.getCode()) : List.of();
                        String constraintText = constraints.stream()
                                .filter(c -> "regulatory".equals(c.getKind()) && c.getExpression() != null)
                                .map(AttributeConstraint::getExpression).findFirst()
                                .or(() -> constraints.stream().map(AttributeConstraint::getExpression)
                                        .filter(Objects::nonNull).findFirst())
                                .orElse(null);

                        List<Map<String, Object>> fragRows = new ArrayList<>();
                        for (Fragment f : frags) {
                            SelectorScope scope = scopeRepo.findById(f.getScopeCode()).orElse(null);
                            int priority = scope != null ? scope.getPriority() : 0;
                            Map<String, Object> fm = new LinkedHashMap<>();
                            fm.put("scopeCode", f.getScopeCode());
                            fm.put("scopeName", scope != null ? scope.getName() : f.getScopeCode());
                            fm.put("priority", priority);
                            fm.put("scopeValue", f.getScopeValue());
                            fm.put("value", f.getValue());
                            fm.put("isWarning", f.isWarning());
                            fm.put("validationMsg", f.getValidationMsg());
                            fragRows.add(fm);

                            if (f.isWarning()) {
                                Map<String, Object> issue = new LinkedHashMap<>();
                                issue.put("slotCode", slot.getCode());
                                issue.put("slotName", slot.getName());
                                issue.put("scopeLabel", scope != null ? scope.getName() : f.getScopeCode());
                                issue.put("scopeValue", f.getScopeValue());
                                issue.put("value", f.getValue());
                                issue.put("message", f.getValidationMsg());
                                constraintIssues.add(issue);
                            }
                            if ("place".equals(f.getScopeCode()) && f.getScopeValue() != null) {
                                for (String tok : f.getScopeValue().split(",")) {
                                    String t = tok.trim();
                                    if (!t.isEmpty()) placeOptions.add(t);
                                }
                            }
                            if ("time".equals(f.getScopeCode()) && f.getScopeValue() != null) {
                                timeOptions.add(f.getScopeValue().trim());
                            }
                        }
                        fragRows.sort(Comparator.comparingInt((Map<String, Object> m) -> ((Number) m.get("priority")).intValue()).reversed());

                        Map<String, Object> slotDetail = new LinkedHashMap<>();
                        slotDetail.put("code", slot.getCode());
                        slotDetail.put("name", slot.getName());
                        slotDetail.put("blockId", pb.getBlockId());
                        slotDetail.put("blockName", block != null ? block.getName() : pb.getBlockId());
                        slotDetail.put("required", slot.isRequired());
                        slotDetail.put("attributeCode", attr != null ? attr.getCode() : slot.getAttributeCode());
                        slotDetail.put("attributeName", attr != null ? attr.getName() : null);
                        slotDetail.put("dataTypeName", dt != null ? dt.getName() : null);
                        slotDetail.put("constraintText", constraintText);
                        slotDetail.put("inheritedFrameValue", frameByKey.get(k));
                        slotDetail.put("fragmentCount", frags.size());
                        slotDetail.put("fragments", fragRows);
                        slotsOut.put(slot.getCode(), slotDetail);
                    }

                    Map<String, Object> bm = new LinkedHashMap<>();
                    bm.put("blockId", pb.getBlockId());
                    bm.put("blockName", block != null ? block.getName() : pb.getBlockId());
                    bm.put("reqFilled", blockReqFilled);
                    bm.put("reqTotal", blockReqTotal);
                    bm.put("slots", slotSummaries);
                    sidebar.add(bm);
                }
            }

            int pct = totalReq > 0 ? Math.round(reqFilled * 100f / totalReq) : 0;

            Map<String, Object> completeness = new LinkedHashMap<>();
            completeness.put("reqFilled", reqFilled);
            completeness.put("totalReq", totalReq);
            completeness.put("pct", pct);

            Map<String, Object> body = new LinkedHashMap<>();
            Map<String, Object> configMeta = new LinkedHashMap<>();
            configMeta.put("code", cfg.getCode());
            configMeta.put("name", cfg.getName());
            configMeta.put("fromTemplateCode", cfg.getFromTemplateCode());
            configMeta.put("status", cfg.getStatus());
            body.put("config", configMeta);
            body.put("templateName", tpl != null ? tpl.getName() : cfg.getFromTemplateCode());
            body.put("completeness", completeness);
            body.put("sidebar", sidebar);
            body.put("missingRequired", missingRequired);
            body.put("constraintIssues", constraintIssues);
            body.put("slots", slotsOut);
            body.put("peopleOptions", List.of("Standard", "Loyalty", "VIP"));
            body.put("placeOptions", new ArrayList<>(placeOptions));
            body.put("timeOptions", new ArrayList<>(timeOptions));

            return body;
        });
    }
}
