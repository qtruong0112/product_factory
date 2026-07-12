package com.f88.productfactory.application.service.governance;

import com.f88.productfactory.domain.model.ontology.FoaElement;
import com.f88.productfactory.domain.model.ontology.ObligationElement;
import com.f88.productfactory.domain.model.ontology.ObligationTypeComposition;
import com.f88.productfactory.domain.model.structure.Block;
import com.f88.productfactory.domain.repository.ontology.FinancialObligationArchetypeRepository;
import com.f88.productfactory.domain.repository.ontology.FoaElementRepository;
import com.f88.productfactory.domain.repository.ontology.ObligationElementRepository;
import com.f88.productfactory.domain.repository.ontology.ObligationTypeCompositionRepository;
import com.f88.productfactory.domain.repository.structure.BlockRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

/**
 * Ma trận ràng buộc (Lớp IV — governance).
 *
 * Giai đoạn 58: chỉ còn đúng 2 ma trận trên màn Ma trận — cả 2 đều PHÁI SINH, không lưu ở
 * constraint_matrix/matrix_cell nữa (2 kind cũ ELEMENTTYPE_X_ELEMENTTYPE/OBLIGATIONTYPE_X_BLOCK
 * và tab derived "Pattern × Block (độ phủ)" đã bỏ khỏi màn Ma trận theo yêu cầu user — banner độ
 * phủ ở Pattern builder đổi sang đọc trực tiếp từ Obligation Element × Block, xem
 * ProductPatternService#detail):
 *   - foaOeMatrix(): PHÁI SINH TỪ foa_element (nguồn duy nhất, từ Giai đoạn 51).
 *   - oeBlockMatrix(): PHÁI SINH TỪ block.governed_by_element_code (Giai đoạn 53b) + đối chiếu
 *     obligation_type_composition (Giai đoạn 67). Chi tiết ở oeBlockMatrix().
 */
@Service
public class ConstraintMatrixService {

    private final ObligationElementRepository elementRepo;
    private final FinancialObligationArchetypeRepository archetypeRepo;
    private final BlockRepository blockRepo;
    private final FoaElementRepository foaElementRepo;
    private final ObligationTypeCompositionRepository compositionRepo;

    public ConstraintMatrixService(ObligationElementRepository elementRepo,
                                   FinancialObligationArchetypeRepository archetypeRepo,
                                   BlockRepository blockRepo,
                                   FoaElementRepository foaElementRepo,
                                   ObligationTypeCompositionRepository compositionRepo) {
        this.elementRepo = elementRepo;
        this.archetypeRepo = archetypeRepo;
        this.blockRepo = blockRepo;
        this.foaElementRepo = foaElementRepo;
        this.compositionRepo = compositionRepo;
    }

    /**
     * Tab "FOA × Obligation Element" — Giai đoạn 51, PHÁI SINH TRỰC TIẾP từ foa_element
     * (nguồn duy nhất sau khi gộp bỏ constraint_matrix kind=ARCHETYPE_X_ELEMENT). Cùng shape với
     * oeBlockMatrix() để FE dùng chung renderer.
     */
    public Map<String, Object> foaOeMatrix() {
        List<FoaElement> all = foaElementRepo.findAll();

        LinkedHashSet<String> rowCodes = new LinkedHashSet<>();
        LinkedHashSet<String> colCodes = new LinkedHashSet<>();
        Map<String, String> verdictByKey = new LinkedHashMap<>();
        for (FoaElement fe : all) {
            rowCodes.add(fe.getElementCode());
            colCodes.add(fe.getArchetypeCode());
            verdictByKey.put(fe.getElementCode() + "" + fe.getArchetypeCode(), fe.getRequirement());
        }

        List<Map<String, Object>> cols = new ArrayList<>();
        for (String cc : colCodes) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", cc);
            m.put("label", archetypeRepo.findById(cc).map(a -> a.getName()).orElse(cc));
            cols.add(m);
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (String rc : rowCodes) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", rc);
            row.put("label", elementRepo.findById(rc).map(e -> e.getName()).orElse(rc));
            List<String> rowCells = new ArrayList<>();
            for (String cc : colCodes) {
                String v = verdictByKey.getOrDefault(rc + "" + cc, "na");
                rowCells.add("required".equals(v) ? "req" : "possible".equals(v) ? "pos" : "na");
            }
            row.put("cells", rowCells);
            rows.add(row);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("rowHead", "Obligation Element");
        body.put("legend", "rpn");
        body.put("cols", cols);
        body.put("rows", rows);
        return body;
    }

    /**
     * Tab "Obligation Element × Block" — Giai đoạn 58 (đường chéo req/na thuần từ
     * block.governed_by_element_code) + Giai đoạn 67 (thêm mức "pos" — Được phép). Rows CHỈ gồm 5
     * Block thực sự có governed_by_element_code (7/12 Block còn lại governed bởi thứ khác không
     * phải OE — xem governed_by_aspect — luôn "na" ở mọi cột nên không đưa vào, giống lý do Giai
     * đoạn 59).
     *
     * Cols: Giai đoạn 67 mở rộng từ "chỉ 5 OE governing" ra TOÀN BỘ Obligation Element THẬT đang
     * được dùng (distinct element_code trong obligation_type_composition) mà CÙNG element_type_code
     * (OET) với OE governing 1 trong 5 Block trên — gộp theo OET liền nhau, bỏ hẳn OET_PARTY (không
     * Block nào chi phối bởi chiều này). Cell: "req" = đúng OE governing của Block; "pos" = OE khác
     * nhưng cùng OET (suy luận kỹ thuật "cùng kiểu câu trả lời cho cùng 1 câu hỏi định tính" — CHƯA
     * có tài liệu xác nhận đây là đúng 100% quy tắc nghiệp vụ, chỉ là derive hợp lý từ cấu trúc OET
     * đã có); "na" = khác OET hoàn toàn.
     */
    public Map<String, Object> oeBlockMatrix() {
        List<Block> governedBlocks = new ArrayList<>();
        for (Block b : blockRepo.findAll()) {
            if (b.getGovernedByElementCode() != null) governedBlocks.add(b);
        }

        Map<String, String> otetByBlock = new LinkedHashMap<>();
        LinkedHashSet<String> relevantOets = new LinkedHashSet<>();
        for (Block b : governedBlocks) {
            String oet = elementRepo.findById(b.getGovernedByElementCode())
                    .map(ObligationElement::getElementTypeCode)
                    .orElse(null);
            otetByBlock.put(b.getId(), oet);
            if (oet != null) relevantOets.add(oet);
        }

        Map<String, List<String>> elementCodesByOet = new LinkedHashMap<>();
        LinkedHashSet<String> seenElementCodes = new LinkedHashSet<>();
        for (ObligationTypeComposition c : compositionRepo.findAll()) {
            String elCode = c.getElementCode();
            if (!seenElementCodes.add(elCode)) continue;
            String oet = elementRepo.findById(elCode).map(ObligationElement::getElementTypeCode).orElse(null);
            if (oet == null || !relevantOets.contains(oet)) continue;
            elementCodesByOet.computeIfAbsent(oet, k -> new ArrayList<>()).add(elCode);
        }

        List<Map<String, Object>> cols = new ArrayList<>();
        LinkedHashSet<String> colCodes = new LinkedHashSet<>();
        for (String oet : relevantOets) {
            for (String elCode : elementCodesByOet.getOrDefault(oet, List.of())) {
                if (!colCodes.add(elCode)) continue;
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("code", elCode);
                m.put("label", elementRepo.findById(elCode).map(e -> e.getName()).orElse(elCode));
                cols.add(m);
            }
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Block b : governedBlocks) {
            String blockOet = otetByBlock.get(b.getId());
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", b.getId());
            row.put("label", b.getName());
            List<String> rowCells = new ArrayList<>();
            for (String cc : colCodes) {
                if (cc.equals(b.getGovernedByElementCode())) {
                    rowCells.add("req");
                } else {
                    String ccOet = elementRepo.findById(cc).map(ObligationElement::getElementTypeCode).orElse(null);
                    rowCells.add(blockOet != null && blockOet.equals(ccOet) ? "pos" : "na");
                }
            }
            row.put("cells", rowCells);
            rows.add(row);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("rowHead", "Block");
        body.put("legend", "rpn");
        body.put("cols", cols);
        body.put("rows", rows);
        return body;
    }
}
