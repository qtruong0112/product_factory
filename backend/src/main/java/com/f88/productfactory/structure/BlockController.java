package com.f88.productfactory.structure;

import com.f88.productfactory.attribute.Attribute;
import com.f88.productfactory.attribute.AttributeRepository;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Block & Answer Slot (Lớp II — structure).
 *
 * KHÁC read-only thuần: màn danh sách cần thêm SỐ ANSWER SLOT (đếm answer_slot) và
 * "CHI PHỐI BỞI" (gov = governed_by_element_code ?? governed_by_aspect) — dữ liệu suy/đếm,
 * nên list tự dựng Page<Map>. Giữ path chuẩn /{id} và /{id}/detail.
 *
 * /{id}/detail join answer_slot + attribute + data_type để cấp nguồn THẬT cho:
 *   - màn thư viện block (nếu cần chi tiết), và
 *   - việc gỡ fix cứng builder Product Pattern (bước wire về DB).
 */
@RestController
@RequestMapping("/api/blocks")
public class BlockController {

    private final BlockRepository repo;
    private final AnswerSlotRepository slotRepo;
    private final AttributeRepository attributeRepo;
    private final DataTypeRepository dataTypeRepo;

    public BlockController(BlockRepository repo,
                           AnswerSlotRepository slotRepo,
                           AttributeRepository attributeRepo,
                           DataTypeRepository dataTypeRepo) {
        this.repo = repo;
        this.slotRepo = slotRepo;
        this.attributeRepo = attributeRepo;
        this.dataTypeRepo = dataTypeRepo;
    }

    /**
     * Danh sách Block (làm giàu):
     * mỗi phần tử = { id, code, name, bizGroup, gov, slotCount, status }.
     */
    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
        Page<Block> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Block b : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", b.getId());
            row.put("code", b.getCode());
            row.put("name", b.getName());
            row.put("bizGroup", b.getBizGroup());
            row.put("gov", b.getGov());
            row.put("slotCount", slotRepo.countByBlockId(b.getId()));
            row.put("status", b.getStatus());
            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /** Chi tiết entity theo PK (id). */
    @GetMapping("/{id}")
    public ResponseEntity<Block> byId(@PathVariable String id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Chi tiết đầy đủ: { block, slots:[{ code,name,type,required,def,rule,attrName,attrCode }] }.
     * - type   = data_type.name  (join attribute.data_type_code -> data_type.code)
     * - attrName = attribute.name (theo attribute_code của slot)
     */
    @GetMapping("/{id}/detail")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable String id) {
        return repo.findById(id).map(block -> {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("block", block);

            List<Map<String, Object>> slots = new ArrayList<>();
            for (AnswerSlot s : slotRepo.findByBlockId(id)) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("code", s.getCode());
                m.put("name", s.getName());
                m.put("required", s.isRequired());
                m.put("def", s.getDefaultValue());
                m.put("rule", s.getRuleText());
                m.put("attrCode", s.getAttributeCode());

                Attribute attr = attributeRepo.findById(s.getAttributeCode()).orElse(null);
                String attrName = attr != null ? attr.getName() : s.getAttributeCode();
                String type = null;
                if (attr != null) {
                    type = dataTypeRepo.findById(attr.getDataTypeCode())
                            .map(DataType::getName)
                            .orElse(attr.getDataTypeCode());
                }
                m.put("attrName", attrName);
                m.put("type", type);

                slots.add(m);
            }
            body.put("slots", slots);

            return ResponseEntity.ok(body);
        }).orElse(ResponseEntity.notFound().build());
    }
}
