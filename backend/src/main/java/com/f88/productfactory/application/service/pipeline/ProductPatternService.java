package com.f88.productfactory.application.service.pipeline;

import com.f88.productfactory.domain.model.attribute.Attribute;
import com.f88.productfactory.domain.model.ontology.ObligationType;
import com.f88.productfactory.domain.model.ontology.ObligationTypeComposition;
import com.f88.productfactory.domain.model.pipeline.PatternBlock;
import com.f88.productfactory.domain.model.pipeline.PatternObligationType;
import com.f88.productfactory.domain.model.pipeline.ProductPattern;
import com.f88.productfactory.domain.model.structure.AnswerSlot;
import com.f88.productfactory.domain.model.structure.Block;
import com.f88.productfactory.domain.model.structure.DataType;
import com.f88.productfactory.infrastructure.persistence.attribute.AttributeRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.FinancialObligationArchetypeRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.ObligationTypeCompositionRepository;
import com.f88.productfactory.infrastructure.persistence.ontology.ObligationTypeRepository;
import com.f88.productfactory.infrastructure.persistence.pipeline.PatternBlockRepository;
import com.f88.productfactory.infrastructure.persistence.pipeline.PatternObligationTypeRepository;
import com.f88.productfactory.infrastructure.persistence.pipeline.ProductIntentRepository;
import com.f88.productfactory.infrastructure.persistence.pipeline.ProductPatternRepository;
import com.f88.productfactory.infrastructure.persistence.structure.AnswerSlotRepository;
import com.f88.productfactory.infrastructure.persistence.structure.BlockRepository;
import com.f88.productfactory.infrastructure.persistence.structure.DataTypeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Product Pattern (Lớp III — Pipeline).
 *
 * KHÁC các bảng read-only thuần: màn danh sách cần thêm SỐ BLOCK (đếm pattern_block)
 * và OBLIGATION TYPE (join tên obligation_type theo role Primary) — đây là dữ liệu join,
 * không phải cột của entity. Vì vậy list tự dựng làm giàu (Page<Map>) thay vì dùng thẳng
 * ReadOnlyController.list(). Vẫn giữ path chuẩn /{code} và /{code}/detail ở controller.
 */
@Service
public class ProductPatternService {

    private final ProductPatternRepository repo;
    private final PatternBlockRepository blockRepo;
    private final PatternObligationTypeRepository obligationRepo;
    private final ProductIntentRepository productIntentRepo;
    private final ObligationTypeRepository obligationTypeRepo;
    private final FinancialObligationArchetypeRepository archetypeRepo;
    private final BlockRepository libBlockRepo;
    private final AnswerSlotRepository slotRepo;
    private final AttributeRepository attributeRepo;
    private final DataTypeRepository dataTypeRepo;
    private final ObligationTypeCompositionRepository compositionRepo;

    public ProductPatternService(ProductPatternRepository repo,
                                 PatternBlockRepository blockRepo,
                                 PatternObligationTypeRepository obligationRepo,
                                 ProductIntentRepository productIntentRepo,
                                 ObligationTypeRepository obligationTypeRepo,
                                 FinancialObligationArchetypeRepository archetypeRepo,
                                 BlockRepository libBlockRepo,
                                 AnswerSlotRepository slotRepo,
                                 AttributeRepository attributeRepo,
                                 DataTypeRepository dataTypeRepo,
                                 ObligationTypeCompositionRepository compositionRepo) {
        this.repo = repo;
        this.blockRepo = blockRepo;
        this.obligationRepo = obligationRepo;
        this.productIntentRepo = productIntentRepo;
        this.obligationTypeRepo = obligationTypeRepo;
        this.archetypeRepo = archetypeRepo;
        this.libBlockRepo = libBlockRepo;
        this.slotRepo = slotRepo;
        this.attributeRepo = attributeRepo;
        this.dataTypeRepo = dataTypeRepo;
        this.compositionRepo = compositionRepo;
    }

    /** Tên obligation_type từ code (fallback về chính code nếu chưa có bản ghi). */
    private String obligationTypeName(String code) {
        return obligationTypeRepo.findById(code)
                .map(ot -> ot.getName())
                .orElse(code);
    }

    /** Tên financial_obligation_archetype theo obligation_type_code (qua archetype_code). */
    private String archetypeNameOfObligationType(String obligationTypeCode) {
        return obligationTypeRepo.findById(obligationTypeCode)
                .map(ObligationType::getArchetypeCode)
                .flatMap(archetypeRepo::findById)
                .map(a -> a.getName())
                .orElse(null);
    }

    /**
     * Danh sách Product Pattern (làm giàu):
     * mỗi phần tử = { code, name, productIntentId, status, blockCount, primaryObligationTypeName }.
     */
    public Page<Map<String, Object>> list(Pageable pageable) {
        Page<ProductPattern> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ProductPattern p : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", p.getCode());
            row.put("name", p.getName());
            row.put("productIntentId", p.getProductIntentId());
            row.put("status", p.getStatus());
            row.put("blockCount", blockRepo.countByPatternCode(p.getCode()));

            // Tên (các) obligation type role=Primary — join tên thật từ obligation_type.
            String primaryName = obligationRepo.findByPatternCode(p.getCode()).stream()
                    .filter(ot -> "Primary".equalsIgnoreCase(ot.getRole()))
                    .map(ot -> obligationTypeName(ot.getObligationTypeCode()))
                    .reduce((a, b) -> a + " + " + b)
                    .orElse(null);
            row.put("primaryObligationTypeName", primaryName);

            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /** Chi tiết entity theo PK (code). */
    public Optional<ProductPattern> byCode(String code) {
        return repo.findById(code);
    }

    /**
     * Chi tiết đầy đủ, sẵn sàng cho builder (wire về DB thật — không còn patternBuilderData.ts):
     * { pattern, productIntentName,
     *   assignedOTs:[{code,name,role,archetype}],
     *   blocks:[{blockId,position,usage, name,bizGroup,gov,status, slots:[{code,name,type,required,def,rule,attrName,attrCode}]}],
     *   coverage:[{blockId,label,verdict,inCanvas}] }.
     */
    public Optional<Map<String, Object>> detail(String code) {
        return repo.findById(code).map(pattern -> {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("pattern", pattern);

            // Product Intent nguồn (có thể NULL).
            String intentName = null;
            if (pattern.getProductIntentId() != null) {
                intentName = productIntentRepo.findById(pattern.getProductIntentId())
                        .map(pi -> pi.getName())
                        .orElse(null);
            }
            body.put("productIntentName", intentName);

            // Obligation type đã gán, kèm tên + role + tên archetype (obligation_type.archetype_code).
            List<PatternObligationType> patternOts = obligationRepo.findByPatternCode(code);
            List<Map<String, Object>> assignedOTs = new ArrayList<>();
            for (PatternObligationType ot : patternOts) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("code", ot.getObligationTypeCode());
                m.put("name", obligationTypeName(ot.getObligationTypeCode()));
                m.put("role", ot.getRole());
                m.put("archetype", archetypeNameOfObligationType(ot.getObligationTypeCode()));
                assignedOTs.add(m);
            }
            body.put("assignedOTs", assignedOTs);

            // Block đã gán, theo thứ tự position — join thư viện block + answer_slot + attribute + data_type.
            List<Map<String, Object>> blocks = new ArrayList<>();
            for (PatternBlock pb : blockRepo.findByPatternCodeOrderByPosition(code)) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("blockId", pb.getBlockId());
                m.put("position", pb.getPosition());
                m.put("usage", pb.getUsage());

                Block block = libBlockRepo.findById(pb.getBlockId()).orElse(null);
                m.put("name", block != null ? block.getName() : pb.getBlockId());
                m.put("bizGroup", block != null ? block.getBizGroup() : null);
                m.put("gov", block != null ? block.getGov() : null);
                m.put("status", block != null ? block.getStatus() : null);

                List<Map<String, Object>> slots = new ArrayList<>();
                for (AnswerSlot s : slotRepo.findByBlockId(pb.getBlockId())) {
                    Map<String, Object> sm = new LinkedHashMap<>();
                    sm.put("code", s.getCode());
                    sm.put("name", s.getName());
                    sm.put("required", s.isRequired());
                    sm.put("def", s.getDefaultValue());
                    sm.put("rule", s.getRuleText());
                    sm.put("attrCode", s.getAttributeCode());

                    Attribute attr = attributeRepo.findById(s.getAttributeCode()).orElse(null);
                    sm.put("attrName", attr != null ? attr.getName() : s.getAttributeCode());
                    String type = null;
                    if (attr != null) {
                        type = dataTypeRepo.findById(attr.getDataTypeCode())
                                .map(DataType::getName)
                                .orElse(attr.getDataTypeCode());
                    }
                    sm.put("type", type);
                    slots.add(sm);
                }
                m.put("slots", slots);

                blocks.add(m);
            }
            body.put("blocks", blocks);

            // Độ phủ (coverage) — Giai đoạn 58: derived từ Obligation Element × Block thật
            // (block.governed_by_element_code, Giai đoạn 53b) thay vì ma trận OTF × Block cũ.
            // Gom mọi Obligation Element dùng trong composition của các OTF đã gán cho pattern,
            // rồi tìm Block nào được 1 trong các OE đó chi phối — Block đó verdict="req".
            Set<String> canvasBlockIds = new LinkedHashSet<>();
            for (PatternBlock pb : blockRepo.findByPatternCodeOrderByPosition(code)) canvasBlockIds.add(pb.getBlockId());

            Set<String> patternElementCodes = new LinkedHashSet<>();
            for (PatternObligationType ot : patternOts) {
                for (ObligationTypeComposition c : compositionRepo.findByObligationTypeCode(ot.getObligationTypeCode())) {
                    patternElementCodes.add(c.getElementCode());
                }
            }

            List<Map<String, Object>> coverage = new ArrayList<>();
            for (Block b : libBlockRepo.findAll()) {
                if (b.getGovernedByElementCode() == null || !patternElementCodes.contains(b.getGovernedByElementCode())) continue;
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("blockId", b.getId());
                m.put("label", b.getName());
                m.put("verdict", "req");
                m.put("inCanvas", canvasBlockIds.contains(b.getId()));
                coverage.add(m);
            }
            body.put("coverage", coverage);

            return body;
        });
    }
}
