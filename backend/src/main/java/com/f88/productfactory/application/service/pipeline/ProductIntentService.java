package com.f88.productfactory.application.service.pipeline;

import com.f88.productfactory.domain.model.ontology.ObligationElement;
import com.f88.productfactory.domain.model.ontology.ObligationElementType;
import com.f88.productfactory.domain.model.ontology.ObligationTypeCore;
import com.f88.productfactory.domain.model.ontology.OtActivationRule;
import com.f88.productfactory.domain.model.pipeline.ProductIntent;
import com.f88.productfactory.domain.model.pipeline.ProductIntentElement;
import com.f88.productfactory.infrastructure.persistence.ontology.FinancialObligationArchetypeRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.ObligationElementRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.ObligationElementTypeRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.ObligationTypeCoreRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.OtActivationRuleRepository;
import com.f88.productfactory.infrastructure.persistence.pipeline.BusinessIntentRepository;
import com.f88.productfactory.infrastructure.persistence.pipeline.ProductIntentElementRepository;
import com.f88.productfactory.infrastructure.persistence.pipeline.ProductIntentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Product Intent (Lớp II — pipeline). Tách khỏi Controller (Giai đoạn 66) vì detail() giờ cần
 * nhóm element nền theo (ot_core_code, leg) — cùng logic {@link com.f88.productfactory.application.service.ontology.ObligationTypeService#detail}
 * — và đối chiếu ot_activation_rule theo đúng dữ liệu của từng Intent.
 */
@Service
public class ProductIntentService {

    private final ProductIntentRepository repo;
    private final ProductIntentElementRepository elementRepo;
    private final BusinessIntentRepository businessIntentRepo;
    private final FinancialObligationArchetypeRepository archetypeRepo;
    private final ObligationTypeCoreRepository typeCoreRepo;
    private final ObligationElementTypeRepository elementTypeRepo;
    private final ObligationElementRepository obligationElementRepo;
    private final OtActivationRuleRepository activationRuleRepo;

    public ProductIntentService(ProductIntentRepository repo,
                                ProductIntentElementRepository elementRepo,
                                BusinessIntentRepository businessIntentRepo,
                                FinancialObligationArchetypeRepository archetypeRepo,
                                ObligationTypeCoreRepository typeCoreRepo,
                                ObligationElementTypeRepository elementTypeRepo,
                                ObligationElementRepository obligationElementRepo,
                                OtActivationRuleRepository activationRuleRepo) {
        this.repo = repo;
        this.elementRepo = elementRepo;
        this.businessIntentRepo = businessIntentRepo;
        this.archetypeRepo = archetypeRepo;
        this.typeCoreRepo = typeCoreRepo;
        this.elementTypeRepo = elementTypeRepo;
        this.obligationElementRepo = obligationElementRepo;
        this.activationRuleRepo = activationRuleRepo;
    }

    /**
     * Danh sách Product Intent (làm giàu): entity gốc + coreCount/auxCount — số OT lõi Cốt lõi/Phụ
     * trợ đã có OE trong product_intent_element, để list hiện tín hiệu cấu trúc OTF đang xây dở.
     */
    public Page<Map<String, Object>> list(Pageable pageable) {
        Page<ProductIntent> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ProductIntent pi : page.getContent()) {
            Set<String> otCoreCodes = elementRepo.findByProductIntentId(pi.getId()).stream()
                    .map(ProductIntentElement::getOtCoreCode)
                    .collect(Collectors.toSet());
            long coreCount = otCoreCodes.stream()
                    .filter(c -> typeCoreRepo.findById(c).map(t -> "core".equals(t.getGroupKind())).orElse(false))
                    .count();
            long auxCount = otCoreCodes.size() - coreCount;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", pi.getId());
            row.put("code", pi.getCode());
            row.put("name", pi.getName());
            row.put("businessIntentId", pi.getBusinessIntentId());
            row.put("archetypeCode", pi.getArchetypeCode());
            row.put("status", pi.getStatus());
            row.put("coreCount", coreCount);
            row.put("auxCount", auxCount);
            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /** Chi tiết entity theo PK (id). */
    public Optional<ProductIntent> byId(Long id) {
        return repo.findById(id);
    }

    /**
     * Chi tiết Product Intent: entity chính + tên BI cha + tên archetype + cấu trúc OT lõi
     * (otCores, nhóm theo ot_core_code::leg — mirror ObligationTypeService.detail()) + đối chiếu
     * bảng kích hoạt OT lõi Phụ trợ (activationRules, kèm isTriggered theo chính OE của Intent này).
     */
    public Optional<Map<String, Object>> detail(Long id) {
        return repo.findById(id).map(intent -> {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("intent", intent);

            String biName = businessIntentRepo.findById(intent.getBusinessIntentId())
                    .map(bi -> bi.getName())
                    .orElse(null);
            body.put("businessIntentName", biName);

            String archetypeName = archetypeRepo.findById(intent.getArchetypeCode())
                    .map(a -> a.getName())
                    .orElse(null);
            body.put("archetypeName", archetypeName);

            List<ProductIntentElement> rows = elementRepo.findByProductIntentId(id);

            Map<String, Map<String, Object>> groups = new LinkedHashMap<>();
            for (ProductIntentElement e : rows) {
                String key = e.getOtCoreCode() + "::" + e.getLeg();
                Map<String, Object> g = groups.get(key);
                if (g == null) {
                    g = new LinkedHashMap<>();
                    g.put("otCoreCode", e.getOtCoreCode());
                    g.put("otCoreName", typeCoreRepo.findById(e.getOtCoreCode())
                            .map(ObligationTypeCore::getName)
                            .orElse(e.getOtCoreCode()));
                    g.put("groupKind", typeCoreRepo.findById(e.getOtCoreCode())
                            .map(ObligationTypeCore::getGroupKind)
                            .orElse(null));
                    g.put("leg", e.getLeg());
                    g.put("elements", new ArrayList<Map<String, Object>>());
                    groups.put(key, g);
                }
                Map<String, Object> el = new LinkedHashMap<>();
                el.put("elementTypeCode", e.getElementTypeCode());
                el.put("elementTypeName", elementTypeRepo.findById(e.getElementTypeCode())
                        .map(ObligationElementType::getName)
                        .orElse(e.getElementTypeCode()));
                el.put("elementCode", e.getElementCode());
                el.put("elementName", obligationElementRepo.findById(e.getElementCode())
                        .map(ObligationElement::getName)
                        .orElse(e.getElementCode()));
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> elements = (List<Map<String, Object>>) g.get("elements");
                elements.add(el);
            }
            body.put("otCores", new ArrayList<>(groups.values()));

            Set<String> intentElementCodes = rows.stream()
                    .map(ProductIntentElement::getElementCode)
                    .collect(Collectors.toSet());

            List<Map<String, Object>> activationRules = new ArrayList<>();
            for (OtActivationRule r : activationRuleRepo.findAll()) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("triggerElementCode", r.getTriggerElementCode());
                m.put("triggerElementName", obligationElementRepo.findById(r.getTriggerElementCode())
                        .map(ObligationElement::getName).orElse(r.getTriggerElementCode()));
                m.put("activatedOtCoreCode", r.getActivatedOtCoreCode());
                m.put("activatedOtCoreName", typeCoreRepo.findById(r.getActivatedOtCoreCode())
                        .map(ObligationTypeCore::getName).orElse(r.getActivatedOtCoreCode()));
                m.put("isTriggered", intentElementCodes.contains(r.getTriggerElementCode()));
                activationRules.add(m);
            }
            body.put("activationRules", activationRules);

            return body;
        });
    }
}
