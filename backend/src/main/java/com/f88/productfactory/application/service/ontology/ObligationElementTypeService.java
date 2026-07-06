package com.f88.productfactory.application.service.ontology;

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
 * Obligation Element Type (Layer I — ontology).
 *
 * KHÁC read-only thuần: tab "Element Type" của màn Obligation Library cần thêm
 * SỐ ELEMENT (đếm obligation_element theo element_type_code) — dữ liệu đếm,
 * nên list tự dựng Page<Map>.
 */
@Service
public class ObligationElementTypeService {

    private final ObligationElementTypeRepository repo;
    private final ObligationElementRepository elementRepo;

    public ObligationElementTypeService(ObligationElementTypeRepository repo,
                                        ObligationElementRepository elementRepo) {
        this.repo = repo;
        this.elementRepo = elementRepo;
    }

    /**
     * Danh sách Element Type (làm giàu):
     * { code, name, shortName, description, isIdentify, elementCount }.
     */
    public Page<Map<String, Object>> list(Pageable pageable) {
        Page<ObligationElementType> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ObligationElementType t : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", t.getCode());
            row.put("name", t.getName());
            row.put("shortName", t.getShortName());
            row.put("description", t.getDescription());
            row.put("isIdentify", t.isIsIdentify());
            row.put("elementCount", elementRepo.countByElementTypeCode(t.getCode()));
            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /** Chi tiết entity theo PK (code). */
    public Optional<ObligationElementType> byId(String code) {
        return repo.findById(code);
    }
}
