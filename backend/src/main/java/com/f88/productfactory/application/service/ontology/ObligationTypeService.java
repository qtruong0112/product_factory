package com.f88.productfactory.application.service.ontology;

import com.f88.productfactory.domain.model.ontology.FinancialObligationArchetype;
import com.f88.productfactory.domain.model.ontology.ObligationType;
import com.f88.productfactory.domain.repository.ontology.FinancialObligationArchetypeRepository;
import com.f88.productfactory.domain.repository.ontology.ObligationTypeCompositionRepository;
import com.f88.productfactory.domain.repository.ontology.ObligationTypeRepository;
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
 * Obligation Type Family — OTF (Layer I — ontology). Tên class/bảng giữ nguyên "ObligationType"
 * (Giai đoạn 51 — xem ghi chú tại {@link ObligationType}).
 *
 * KHÁC read-only thuần: tab "Obligation Type Family (OTF)" của màn Obligation Library cần thêm
 * ARCHETYPE (tên, join financial_obligation_archetype) và SỐ ELEMENT (đếm obligation_type_composition)
 * — dữ liệu join/đếm, nên list tự dựng Page<Map>. Giai đoạn 51: bỏ family_code/obligation_family
 * (trùng 1:1 với archetype_code) khỏi list.
 */
@Service
public class ObligationTypeService {

    private final ObligationTypeRepository repo;
    private final FinancialObligationArchetypeRepository archetypeRepo;
    private final ObligationTypeCompositionRepository compositionRepo;

    public ObligationTypeService(ObligationTypeRepository repo,
                                 FinancialObligationArchetypeRepository archetypeRepo,
                                 ObligationTypeCompositionRepository compositionRepo) {
        this.repo = repo;
        this.archetypeRepo = archetypeRepo;
        this.compositionRepo = compositionRepo;
    }

    /**
     * Danh sách Obligation Type Family (làm giàu):
     * { code, name, archetypeCode, status, archetypeName, elementCount }.
     */
    public Page<Map<String, Object>> list(Pageable pageable) {
        Page<ObligationType> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ObligationType t : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", t.getCode());
            row.put("name", t.getName());
            row.put("archetypeCode", t.getArchetypeCode());
            row.put("status", t.getStatus());
            row.put("archetypeName", archetypeRepo.findById(t.getArchetypeCode())
                    .map(FinancialObligationArchetype::getName)
                    .orElse(t.getArchetypeCode()));
            row.put("elementCount", compositionRepo.countByObligationTypeCode(t.getCode()));
            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /** Chi tiết entity theo PK (code). */
    public Optional<ObligationType> byId(String code) {
        return repo.findById(code);
    }
}
