package com.f88.productfactory.application.service.ontology;

import com.f88.productfactory.domain.model.ontology.FinancialObligationArchetype;
import com.f88.productfactory.domain.model.ontology.ObligationElement;
import com.f88.productfactory.domain.model.ontology.ObligationElementType;
import com.f88.productfactory.domain.model.ontology.ObligationType;
import com.f88.productfactory.domain.model.ontology.ObligationTypeComposition;
import com.f88.productfactory.domain.model.ontology.ObligationTypeCore;
import com.f88.productfactory.domain.model.pipeline.PatternObligationType;
import com.f88.productfactory.domain.model.pipeline.ProductPattern;
import com.f88.productfactory.domain.model.structure.Block;
import com.f88.productfactory.infrastructure.persistence.ontology.FinancialObligationArchetypeRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.ObligationElementRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.ObligationElementTypeRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.ObligationTypeCompositionRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.ObligationTypeCoreRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.ObligationTypeRepository;
import com.f88.productfactory.infrastructure.persistence.pipeline.PatternObligationTypeRepository;
import com.f88.productfactory.infrastructure.persistence.pipeline.ProductPatternRepository;
import com.f88.productfactory.infrastructure.persistence.structure.BlockRepository;
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
    private final ObligationTypeCoreRepository typeCoreRepo;
    private final ObligationElementTypeRepository elementTypeRepo;
    private final ObligationElementRepository elementRepo;
    private final PatternObligationTypeRepository patternObligationTypeRepo;
    private final ProductPatternRepository patternRepo;
    private final BlockRepository blockRepo;

    public ObligationTypeService(ObligationTypeRepository repo,
                                 FinancialObligationArchetypeRepository archetypeRepo,
                                 ObligationTypeCompositionRepository compositionRepo,
                                 ObligationTypeCoreRepository typeCoreRepo,
                                 ObligationElementTypeRepository elementTypeRepo,
                                 ObligationElementRepository elementRepo,
                                 PatternObligationTypeRepository patternObligationTypeRepo,
                                 ProductPatternRepository patternRepo,
                                 BlockRepository blockRepo) {
        this.repo = repo;
        this.archetypeRepo = archetypeRepo;
        this.compositionRepo = compositionRepo;
        this.typeCoreRepo = typeCoreRepo;
        this.elementTypeRepo = elementTypeRepo;
        this.elementRepo = elementRepo;
        this.patternObligationTypeRepo = patternObligationTypeRepo;
        this.patternRepo = patternRepo;
        this.blockRepo = blockRepo;
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

    /**
     * Chi tiết đầy đủ 1 OTF: { otf, archetypeName, patterns:[{patternCode,patternName,role}],
     * otCores:[{otCoreCode,otCoreName,groupKind,leg,elements:[{elementTypeCode,elementTypeName,elementCode,elementName,blockId,blockName}]}] }.
     * otCores nhóm theo (ot_core_code, leg) — 1 OTF = nhiều OT lõi, mỗi OT lõi đủ 6 OET (Giai đoạn 51).
     * blockId/blockName (Giai đoạn 53b, null nếu không có) = Block được "chi phối bởi" chính OE đó
     * (block.governed_by_element_code) — theo tài liệu "Lớp vỏ thương mại": OE định tính, Block là
     * tầng kế tiếp (nhóm Attribute định lượng hóa OE đó), không phải OE "chứa" Block.
     */
    public Optional<Map<String, Object>> detail(String code) {
        return repo.findById(code).map(type -> {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("otf", type);
            body.put("archetypeName", archetypeRepo.findById(type.getArchetypeCode())
                    .map(FinancialObligationArchetype::getName)
                    .orElse(type.getArchetypeCode()));

            List<Map<String, Object>> patterns = new ArrayList<>();
            for (PatternObligationType pot : patternObligationTypeRepo.findByObligationTypeCode(code)) {
                Map<String, Object> p = new LinkedHashMap<>();
                p.put("patternCode", pot.getPatternCode());
                p.put("patternName", patternRepo.findById(pot.getPatternCode())
                        .map(ProductPattern::getName)
                        .orElse(pot.getPatternCode()));
                p.put("role", pot.getRole());
                patterns.add(p);
            }
            body.put("patterns", patterns);

            Map<String, Map<String, Object>> groups = new LinkedHashMap<>();
            for (ObligationTypeComposition c : compositionRepo.findByObligationTypeCode(code)) {
                String key = c.getOtCoreCode() + "::" + c.getLeg();
                Map<String, Object> g = groups.get(key);
                if (g == null) {
                    g = new LinkedHashMap<>();
                    g.put("otCoreCode", c.getOtCoreCode());
                    g.put("otCoreName", typeCoreRepo.findById(c.getOtCoreCode())
                            .map(ObligationTypeCore::getName)
                            .orElse(c.getOtCoreCode()));
                    g.put("groupKind", typeCoreRepo.findById(c.getOtCoreCode())
                            .map(ObligationTypeCore::getGroupKind)
                            .orElse(null));
                    g.put("leg", c.getLeg());
                    g.put("elements", new ArrayList<Map<String, Object>>());
                    groups.put(key, g);
                }
                Map<String, Object> el = new LinkedHashMap<>();
                el.put("elementTypeCode", c.getElementTypeCode());
                el.put("elementTypeName", elementTypeRepo.findById(c.getElementTypeCode())
                        .map(ObligationElementType::getName)
                        .orElse(c.getElementTypeCode()));
                el.put("elementCode", c.getElementCode());
                el.put("elementName", elementRepo.findById(c.getElementCode())
                        .map(ObligationElement::getName)
                        .orElse(c.getElementCode()));
                List<Block> governedBlocks = blockRepo.findByGovernedByElementCode(c.getElementCode());
                el.put("blockId", governedBlocks.isEmpty() ? null : governedBlocks.get(0).getId());
                el.put("blockName", governedBlocks.isEmpty() ? null : governedBlocks.get(0).getName());
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> elements = (List<Map<String, Object>>) g.get("elements");
                elements.add(el);
            }
            body.put("otCores", new ArrayList<>(groups.values()));

            return body;
        });
    }
}
