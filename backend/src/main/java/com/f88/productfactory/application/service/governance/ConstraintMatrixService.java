package com.f88.productfactory.application.service.governance;

import com.f88.productfactory.domain.model.ontology.FoaElement;
import com.f88.productfactory.domain.model.structure.Block;
import com.f88.productfactory.domain.repository.ontology.FinancialObligationArchetypeRepository;
import com.f88.productfactory.domain.repository.ontology.FoaElementRepository;
import com.f88.productfactory.domain.repository.ontology.ObligationElementRepository;
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
 *   - oeBlockMatrix(): PHÁI SINH TỪ block.governed_by_element_code (nguồn duy nhất, từ Giai đoạn 53b)
 *     — mỗi Block chỉ do tối đa 1 Obligation Element chi phối (không có mức "tuỳ chọn", chỉ
 *     req/na), nên rows=Block (toàn bộ), cols=các OE thực sự chi phối ít nhất 1 Block.
 */
@Service
public class ConstraintMatrixService {

    private final ObligationElementRepository elementRepo;
    private final FinancialObligationArchetypeRepository archetypeRepo;
    private final BlockRepository blockRepo;
    private final FoaElementRepository foaElementRepo;

    public ConstraintMatrixService(ObligationElementRepository elementRepo,
                                   FinancialObligationArchetypeRepository archetypeRepo,
                                   BlockRepository blockRepo,
                                   FoaElementRepository foaElementRepo) {
        this.elementRepo = elementRepo;
        this.archetypeRepo = archetypeRepo;
        this.blockRepo = blockRepo;
        this.foaElementRepo = foaElementRepo;
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
     * Tab "Obligation Element × Block" — Giai đoạn 58, PHÁI SINH TRỰC TIẾP từ
     * block.governed_by_element_code (nguồn duy nhất, không lưu matrix_cell riêng). Mỗi Block tối
     * đa 1 OE chi phối → chỉ 2 mức req/na (không có "tuỳ chọn"). Cols = các OE thực sự chi phối
     * ít nhất 1 Block; rows = toàn bộ Block trong thư viện.
     */
    public Map<String, Object> oeBlockMatrix() {
        List<Block> allBlocks = blockRepo.findAll();

        LinkedHashSet<String> colCodes = new LinkedHashSet<>();
        for (Block b : allBlocks) {
            if (b.getGovernedByElementCode() != null) colCodes.add(b.getGovernedByElementCode());
        }

        List<Map<String, Object>> cols = new ArrayList<>();
        for (String cc : colCodes) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", cc);
            m.put("label", elementRepo.findById(cc).map(e -> e.getName()).orElse(cc));
            cols.add(m);
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Block b : allBlocks) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", b.getId());
            row.put("label", b.getName());
            List<String> rowCells = new ArrayList<>();
            for (String cc : colCodes) {
                rowCells.add(cc.equals(b.getGovernedByElementCode()) ? "req" : "na");
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
