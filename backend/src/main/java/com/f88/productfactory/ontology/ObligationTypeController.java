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
 * Obligation Type (Layer I — ontology).
 *
 * KHÁC read-only thuần: tab "Obligation Type" của màn Obligation Library cần thêm
 * FAMILY (tên, join obligation_family), ARCHETYPE (tên, join financial_obligation_archetype)
 * và SỐ ELEMENT (đếm obligation_type_composition) — dữ liệu join/đếm, nên list tự dựng Page<Map>.
 */
@RestController
@RequestMapping("/api/obligation-types")
public class ObligationTypeController {

    private final ObligationTypeRepository repo;
    private final ObligationFamilyRepository familyRepo;
    private final FinancialObligationArchetypeRepository archetypeRepo;
    private final ObligationTypeCompositionRepository compositionRepo;

    public ObligationTypeController(ObligationTypeRepository repo,
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
    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
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
    @GetMapping("/{code}")
    public ResponseEntity<ObligationType> byId(@PathVariable String code) {
        return repo.findById(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
