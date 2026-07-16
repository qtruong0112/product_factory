package com.f88.productfactory.application.service.ontology;

import com.f88.productfactory.domain.model.ontology.FinancialObligationArchetype;
import com.f88.productfactory.domain.model.ontology.FoaElement;
import com.f88.productfactory.domain.model.ontology.ObligationElement;
import com.f88.productfactory.domain.model.ontology.ObligationElementType;
import com.f88.productfactory.domain.model.ontology.ObligationType;
import com.f88.productfactory.domain.model.ontology.ObligationTypeCore;
import com.f88.productfactory.domain.model.ontology.OtActivationRule;
import com.f88.productfactory.infrastructure.persistence.ontology.FinancialObligationArchetypeRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.FoaElementRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.ObligationElementRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.ObligationElementTypeRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.ObligationTypeCoreRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.ObligationTypeRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.OtActivationRuleRepository;
import com.f88.productfactory.infrastructure.persistence.pipeline.PatternObligationTypeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
@Service
public class FinancialObligationArchetypeService {

    private final FinancialObligationArchetypeRepository repo;
    private final ObligationTypeRepository obligationTypeRepo;
    private final FoaElementRepository foaElementRepo;
    private final ObligationElementRepository obligationElementRepo;
    private final ObligationElementTypeRepository elementTypeRepo;
    private final PatternObligationTypeRepository patternObligationTypeRepo;
    private final OtActivationRuleRepository activationRuleRepo;
    private final ObligationTypeCoreRepository obligationTypeCoreRepo;

    public FinancialObligationArchetypeService(FinancialObligationArchetypeRepository repo,
                                               ObligationTypeRepository obligationTypeRepo,
                                               FoaElementRepository foaElementRepo,
                                               ObligationElementRepository obligationElementRepo,
                                               ObligationElementTypeRepository elementTypeRepo,
                                               PatternObligationTypeRepository patternObligationTypeRepo,
                                               OtActivationRuleRepository activationRuleRepo,
                                               ObligationTypeCoreRepository obligationTypeCoreRepo) {
        this.repo = repo;
        this.obligationTypeRepo = obligationTypeRepo;
        this.foaElementRepo = foaElementRepo;
        this.obligationElementRepo = obligationElementRepo;
        this.elementTypeRepo = elementTypeRepo;
        this.patternObligationTypeRepo = patternObligationTypeRepo;
        this.activationRuleRepo = activationRuleRepo;
        this.obligationTypeCoreRepo = obligationTypeCoreRepo;
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
    public Page<Map<String, Object>> list(Pageable pageable) {
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
    public Optional<FinancialObligationArchetype> byId(String code) {
        return repo.findById(code);
    }

    /**
     * Chi tiết đầy đủ:
     * { archetype, typeCount, elementCount, productCount,
     *   elementRows:[{code,name,elementTypeName,requirement}],
     *   typeRows:[{code,name,status,productCount}] }.
     */
    public Optional<Map<String, Object>> detail(String code) {
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

            // Giai đoạn 51: quy tắc OE → bật OT phụ trợ (Mục 6 tài liệu Lõi Nghĩa Vụ) — ĐỘC LẬP
            // với FOA (áp dụng như nhau cho mọi archetype), chỉ hiển thị minh bạch ở đây.
            List<Map<String, Object>> activationRules = new ArrayList<>();
            for (OtActivationRule r : activationRuleRepo.findAll()) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("triggerElementCode", r.getTriggerElementCode());
                m.put("triggerElementName", obligationElementRepo.findById(r.getTriggerElementCode())
                        .map(ObligationElement::getName).orElse(r.getTriggerElementCode()));
                m.put("activatedOtCoreCode", r.getActivatedOtCoreCode());
                m.put("activatedOtCoreName", obligationTypeCoreRepo.findById(r.getActivatedOtCoreCode())
                        .map(ObligationTypeCore::getName).orElse(r.getActivatedOtCoreCode()));
                activationRules.add(m);
            }
            body.put("activationRules", activationRules);

            return body;
        });
    }
}
