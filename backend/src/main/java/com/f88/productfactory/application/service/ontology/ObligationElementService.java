package com.f88.productfactory.application.service.ontology;

import com.f88.productfactory.domain.model.ontology.ObligationElement;
import com.f88.productfactory.domain.model.ontology.ObligationElementType;
import com.f88.productfactory.domain.repository.ontology.ObligationElementRepository;
import com.f88.productfactory.domain.repository.ontology.ObligationElementTypeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
@Service
public class ObligationElementService {

    private final ObligationElementRepository repo;
    private final ObligationElementTypeRepository elementTypeRepo;

    public ObligationElementService(ObligationElementRepository repo,
                                    ObligationElementTypeRepository elementTypeRepo) {
        this.repo = repo;
        this.elementTypeRepo = elementTypeRepo;
    }

    /**
     * Danh sách Obligation Element (làm giàu):
     * { code, name, elementTypeCode, elementTypeName, isIdentify }.
     */
    public Page<Map<String, Object>> list(Pageable pageable) {
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
    public Optional<ObligationElement> byId(String code) {
        return repo.findById(code);
    }
}
