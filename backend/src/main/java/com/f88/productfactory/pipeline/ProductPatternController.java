package com.f88.productfactory.pipeline;

import com.f88.productfactory.attribute.Attribute;
import com.f88.productfactory.attribute.AttributeRepository;
import com.f88.productfactory.governance.ConstraintMatrix;
import com.f88.productfactory.governance.ConstraintMatrixRepository;
import com.f88.productfactory.governance.MatrixCell;
import com.f88.productfactory.governance.MatrixCellRepository;
import com.f88.productfactory.ontology.FinancialObligationArchetypeRepository;
import com.f88.productfactory.ontology.ObligationType;
import com.f88.productfactory.ontology.ObligationTypeRepository;
import com.f88.productfactory.structure.AnswerSlot;
import com.f88.productfactory.structure.AnswerSlotRepository;
import com.f88.productfactory.structure.Block;
import com.f88.productfactory.structure.BlockRepository;
import com.f88.productfactory.structure.DataType;
import com.f88.productfactory.structure.DataTypeRepository;
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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Product Pattern (Lớp III — Pipeline).
 *
 * KHÁC các bảng read-only thuần: màn danh sách cần thêm SỐ BLOCK (đếm pattern_block)
 * và OBLIGATION TYPE (join tên obligation_type theo role Primary) — đây là dữ liệu join,
 * không phải cột của entity. Vì vậy controller tự dựng list làm giàu (Page<Map>) thay vì
 * dùng thẳng ReadOnlyController.list(). Vẫn giữ path chuẩn /{code} và /{code}/detail.
 */
@RestController
@RequestMapping("/api/product-patterns")
public class ProductPatternController {

    // 6 block "cover" của ma trận 3 (OBLIGATIONTYPE_X_BLOCK) — trùng COVER_BLOCKS của
    // ConstraintMatrixController, dùng để tính độ phủ builder theo obligation type đã gán.
    private static final List<String> COVER_BLOCKS = List.of(
            "BLK_COUNTERPARTY", "BLK_INTEREST", "BLK_COLLATERAL", "BLK_REPAYMENT", "BLK_LIMIT", "BLK_PENALTY");

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
    private final ConstraintMatrixRepository matrixRepo;
    private final MatrixCellRepository matrixCellRepo;

    public ProductPatternController(ProductPatternRepository repo,
                                    PatternBlockRepository blockRepo,
                                    PatternObligationTypeRepository obligationRepo,
                                    ProductIntentRepository productIntentRepo,
                                    ObligationTypeRepository obligationTypeRepo,
                                    FinancialObligationArchetypeRepository archetypeRepo,
                                    BlockRepository libBlockRepo,
                                    AnswerSlotRepository slotRepo,
                                    AttributeRepository attributeRepo,
                                    DataTypeRepository dataTypeRepo,
                                    ConstraintMatrixRepository matrixRepo,
                                    MatrixCellRepository matrixCellRepo) {
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
        this.matrixRepo = matrixRepo;
        this.matrixCellRepo = matrixCellRepo;
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

    private static int rank(String v) {
        return switch (v) { case "req" -> 2; case "pos" -> 1; default -> 0; };
    }
    private static String unrank(int r) {
        return r == 2 ? "req" : r == 1 ? "pos" : "na";
    }

    /**
     * Danh sách Product Pattern (làm giàu):
     * mỗi phần tử = { code, name, productIntentId, status, blockCount, primaryObligationTypeName }.
     */
    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
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
    @GetMapping("/{code}")
    public ResponseEntity<ProductPattern> byCode(@PathVariable String code) {
        return repo.findById(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Chi tiết đầy đủ, sẵn sàng cho builder (wire về DB thật — không còn patternBuilderData.ts):
     * { pattern, productIntentName,
     *   assignedOTs:[{code,name,role,archetype}],
     *   blocks:[{blockId,position,usage, name,bizGroup,gov,status, slots:[{code,name,type,required,def,rule,attrName,attrCode}]}],
     *   coverage:[{blockId,label,verdict,inCanvas}] }.
     */
    @GetMapping("/{code}/detail")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable String code) {
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

            // Độ phủ (coverage) — ma trận 3 OBLIGATIONTYPE_X_BLOCK, gộp mức mạnh nhất (na<pos<req)
            // trên các obligation type đã gán, cho 6 block "cover". Cùng logic ConstraintMatrixController.
            Set<String> canvasBlockIds = new LinkedHashSet<>();
            for (PatternBlock pb : blockRepo.findByPatternCodeOrderByPosition(code)) canvasBlockIds.add(pb.getBlockId());

            Long m3Id = matrixRepo.findAllByOrderByIdAsc().stream()
                    .filter(m -> "OBLIGATIONTYPE_X_BLOCK".equals(m.getKind()))
                    .map(ConstraintMatrix::getId)
                    .findFirst().orElse(null);
            Map<String, String> otBlockVerdict = new LinkedHashMap<>();
            if (m3Id != null) {
                for (MatrixCell c : matrixCellRepo.findByMatrixId(m3Id)) {
                    otBlockVerdict.put(c.getRowCode() + "" + c.getColCode(), c.getVerdict());
                }
            }

            List<Map<String, Object>> coverage = new ArrayList<>();
            for (String blockId : COVER_BLOCKS) {
                int best = 0; // na
                for (PatternObligationType ot : patternOts) {
                    String v = otBlockVerdict.get(ot.getObligationTypeCode() + "" + blockId);
                    if (v != null) best = Math.max(best, rank(v));
                }
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("blockId", blockId);
                m.put("label", libBlockRepo.findById(blockId).map(Block::getName).orElse(blockId));
                m.put("verdict", unrank(best));
                m.put("inCanvas", canvasBlockIds.contains(blockId));
                coverage.add(m);
            }
            body.put("coverage", coverage);

            return ResponseEntity.ok(body);
        }).orElse(ResponseEntity.notFound().build());
    }
}
