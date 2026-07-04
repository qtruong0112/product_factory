package com.f88.productfactory.ontology;

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
 * Obligation Element (Layer I — ontology).
 *
 * KHÁC read-only thuần: tab "Obligation Element" của màn Obligation Library cần thêm
 * ELEMENT TYPE (tên, join obligation_element_type) và IS_IDENTIFY (cờ nằm ở
 * obligation_element_type, không phải obligation_element — join qua element_type_code)
 * — dữ liệu join, nên list tự dựng Page<Map>.
 *
 * Lưu ý: bảng obligation_element KHÔNG có cột status (khác prototype UI) — không bịa,
 * bỏ cột này khỏi UI thật.
 */
@RestController
@RequestMapping("/api/obligation-elements")
public class ObligationElementController {

    private final ObligationElementRepository repo;
    private final ObligationElementTypeRepository elementTypeRepo;

    public ObligationElementController(ObligationElementRepository repo,
                                       ObligationElementTypeRepository elementTypeRepo) {
        this.repo = repo;
        this.elementTypeRepo = elementTypeRepo;
    }

    /**
     * Danh sách Obligation Element (làm giàu):
     * { code, name, elementTypeCode, elementTypeName, isIdentify }.
     */
    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
        Page<ObligationElement> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ObligationElement e : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", e.getCode());
            row.put("name", e.getName());
            row.put("elementTypeCode", e.getElementTypeCode());

            ObligationElementType et = elementTypeRepo.findById(e.getElementTypeCode()).orElse(null);
            row.put("elementTypeName", et != null ? et.getName() : e.getElementTypeCode());
            row.put("isIdentify", et != null && et.isIsIdentify());

            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /** Chi tiết entity theo PK (code). */
    @GetMapping("/{code}")
    public ResponseEntity<ObligationElement> byId(@PathVariable String code) {
        return repo.findById(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
