package com.f88.productfactory.application.service.ontology;

import com.f88.productfactory.domain.model.ontology.FinancialObligationArchetype;
import com.f88.productfactory.domain.model.ontology.ObligationFamily;
import com.f88.productfactory.domain.model.ontology.ObligationType;
import com.f88.productfactory.domain.repository.ontology.FinancialObligationArchetypeRepository;
import com.f88.productfactory.domain.repository.ontology.ObligationFamilyRepository;
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
 * Obligation Type (Layer I — ontology).
 *
 * KHÁC read-only thuần: tab "Obligation Type" của màn Obligation Library cần thêm
 * FAMILY (tên, join obligation_family), ARCHETYPE (tên, join financial_obligation_archetype)
 * và SỐ ELEMENT (đếm obligation_type_composition) — dữ liệu join/đếm, nên list tự dựng Page<Map>.
 */
@Service
public class ObligationTypeService {

    private final ObligationTypeRepository repo;
    private final ObligationFamilyRepository familyRepo;
    private final FinancialObligationArchetypeRepository archetypeRepo;
    private final ObligationTypeCompositionRepository compositionRepo;

    public ObligationTypeService(ObligationTypeRepository repo,
                                 ObligationFamilyRepository familyRepo,
                                 FinancialObligationArchetypeRepository archetypeRepo,
                                 ObligationTypeCompositionRepository compositionRepo) {
        this.repo = repo;
        this.familyRepo = familyRepo;
        this.archetypeRepo = archetypeRepo;
        this.compositionRepo = compositionRepo;
    }

    /**
     * Danh sách Obligation Type (làm giàu):
     * { code, name, familyCode, archetypeCode, status, familyName, archetypeName, elementCount }.
     */
    public Page<Map<String, Object>> list(Pageable pageable) {
        Page<ObligationType> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ObligationType t : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", t.getCode());
            row.put("name", t.getName());
            row.put("familyCode", t.getFamilyCode());
            row.put("archetypeCode", t.getArchetypeCode());
            row.put("status", t.getStatus());
            row.put("familyName", familyRepo.findById(t.getFamilyCode())
                    .map(ObligationFamily::getName)
                    .orElse(t.getFamilyCode()));
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
