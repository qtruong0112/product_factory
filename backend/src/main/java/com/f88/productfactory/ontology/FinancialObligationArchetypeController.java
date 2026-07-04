package com.f88.productfactory.ontology;

import com.f88.productfactory.pipeline.PatternObligationTypeRepository;
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
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Financial Obligation Archetype (Layer I — ontology).
 *
 * KHÁC read-only thuần: màn "archetype" là card grid (KHÔNG phải list thường — không
 * nằm trong isList của prototype) + trang detail riêng. Card cần TYPECOUNT (đếm
 * obligation_type theo archetype_code), ELEMENTCOUNT (đếm foa_element) và PRODUCTCOUNT
 * (số pattern khác nhau đang dùng 1 trong các Obligation Type của archetype, qua
 * pattern_obligation_type) — dữ liệu join/đếm, nên tự dựng Page<Map>.
 *
 * Lưu ý: bảng financial_obligation_archetype KHÔNG có cột status (khác prototype UI
 * vốn gắn published/approved cho mỗi archetype) — không bịa, bỏ khỏi UI thật.
 */
@RestController
@RequestMapping("/api/archetypes")
public class FinancialObligationArchetypeController {

    private final FinancialObligationArchetypeRepository repo;
    private final ObligationTypeRepository obligationTypeRepo;
    private final FoaElementRepository foaElementRepo;
    private final ObligationElementRepository obligationElementRepo;
    private final ObligationElementTypeRepository elementTypeRepo;
    private final PatternObligationTypeRepository patternObligationTypeRepo;

    public FinancialObligationArchetypeController(FinancialObligationArchetypeRepository repo,
                                                  ObligationTypeRepository obligationTypeRepo,
                                                  FoaElementRepository foaElementRepo,
                                                  ObligationElementRepository obligationElementRepo,
                                                  ObligationElementTypeRepository elementTypeRepo,
                                                  PatternObligationTypeRepository patternObligationTypeRepo) {
        this.repo = repo;
        this.obligationTypeRepo = obligationTypeRepo;
        this.foaElementRepo = foaElementRepo;
        this.obligationElementRepo = obligationElementRepo;
        this.elementTypeRepo = elementTypeRepo;
        this.patternObligationTypeRepo = patternObligationTypeRepo;
    }

    /** Đếm số pattern khác nhau dùng ít nhất 1 trong các Obligation Type đã cho. */
    private long countDistinctProducts(List<ObligationType> types) {
        Set<String> patterns = new HashSet<>();
        for (ObligationType t : types) {
            patternObligationTypeRepo.findByObligationTypeCode(t.getCode())
                    .forEach(pot -> patterns.add(pot.getPatternCode()));
        }
        return patterns.size();
    }

    /**
     * Danh sách Archetype (card grid, làm giàu):
     * { code, name, nature, valueStructure, typeCount, elementCount, productCount }.
     */
    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
        Page<FinancialObligationArchetype> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (FinancialObligationArchetype a : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", a.getCode());
            row.put("name", a.getName());
            row.put("nature", a.getNature());
            row.put("valueStructure", a.getValueStructure());

            List<ObligationType> types = obligationTypeRepo.findByArchetypeCode(a.getCode());
            row.put("typeCount", types.size());
            row.put("elementCount", foaElementRepo.findByArchetypeCode(a.getCode()).size());
            row.put("productCount", countDistinctProducts(types));

            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /** Chi tiết entity theo PK (code). */
    @GetMapping("/{code}")
    public ResponseEntity<FinancialObligationArchetype> byId(@PathVariable String code) {
        return repo.findById(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Chi tiết đầy đủ:
     * { archetype, typeCount, elementCount, productCount,
     *   elementRows:[{code,name,elementTypeName,requirement}],
     *   typeRows:[{code,name,status,productCount}] }.
     */
    @GetMapping("/{code}/detail")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable String code) {
        return repo.findById(code).map(archetype -> {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("archetype", archetype);

            List<ObligationType> types = obligationTypeRepo.findByArchetypeCode(code);
            List<FoaElement> foaElements = foaElementRepo.findByArchetypeCode(code);

            body.put("typeCount", types.size());
            body.put("elementCount", foaElements.size());
            body.put("productCount", countDistinctProducts(types));

            List<Map<String, Object>> elementRows = new ArrayList<>();
            for (FoaElement fe : foaElements) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("code", fe.getElementCode());
                ObligationElement el = obligationElementRepo.findById(fe.getElementCode()).orElse(null);
                m.put("name", el != null ? el.getName() : fe.getElementCode());
                String elementTypeName = null;
                if (el != null) {
                    elementTypeName = elementTypeRepo.findById(el.getElementTypeCode())
                            .map(ObligationElementType::getName)
                            .orElse(el.getElementTypeCode());
                }
                m.put("elementTypeName", elementTypeName);
                m.put("requirement", fe.getRequirement());
                elementRows.add(m);
            }
            body.put("elementRows", elementRows);

            List<Map<String, Object>> typeRows = new ArrayList<>();
            for (ObligationType t : types) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("code", t.getCode());
                m.put("name", t.getName());
                m.put("status", t.getStatus());
                m.put("productCount", patternObligationTypeRepo.findByObligationTypeCode(t.getCode()).size());
                typeRows.add(m);
            }
            body.put("typeRows", typeRows);

            return ResponseEntity.ok(body);
        }).orElse(ResponseEntity.notFound().build());
    }
}
