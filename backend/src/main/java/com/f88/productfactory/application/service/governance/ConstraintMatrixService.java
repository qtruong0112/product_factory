package com.f88.productfactory.application.service.governance;

import com.f88.productfactory.domain.model.governance.ConstraintMatrix;
import com.f88.productfactory.domain.model.governance.MatrixCell;
import com.f88.productfactory.domain.model.pipeline.PatternObligationType;
import com.f88.productfactory.domain.model.pipeline.ProductPattern;
import com.f88.productfactory.domain.model.ontology.FoaElement;
import com.f88.productfactory.domain.repository.governance.ConstraintMatrixRepository;
import com.f88.productfactory.domain.repository.governance.MatrixCellRepository;
import com.f88.productfactory.domain.repository.ontology.FinancialObligationArchetypeRepository;
import com.f88.productfactory.domain.repository.ontology.FoaElementRepository;
import com.f88.productfactory.domain.repository.ontology.ObligationElementRepository;
import com.f88.productfactory.domain.repository.ontology.ObligationElementTypeRepository;
import com.f88.productfactory.domain.repository.ontology.ObligationTypeRepository;
import com.f88.productfactory.domain.repository.pipeline.PatternObligationTypeRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductPatternRepository;
import com.f88.productfactory.domain.repository.structure.BlockRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Ma trận ràng buộc (Lớp IV — governance).
 *
 * 2 ma trận THẬT còn lưu trong DB (constraint_matrix + matrix_cell):
 *   2 ELEMENTTYPE_X_ELEMENTTYPE, 3 OBLIGATIONTYPE_X_BLOCK.
 * Nhãn hàng/cột KHÔNG nằm trong matrix_cell (chỉ có code) → join theo kind từ các bảng tên thật:
 *   - ELEMENTTYPE_X_ELEMENTTYPE: row/col=obligation_element_type.name
 *   - OBLIGATIONTYPE_X_BLOCK: row=obligation_type.name, col=block.name
 *
 * Giai đoạn 51: ma trận 1 (ARCHETYPE_X_ELEMENT) đã BỎ khỏi constraint_matrix — trùng lặp dữ liệu
 * với foa_element (đều lưu FOA × Obligation Element requirement). foaOeMatrix() thay thế đúng vai
 * trò đó, PHÁI SINH TRỰC TIẾP từ foa_element (nguồn duy nhất), cùng cơ chế derived-tab với
 * patternCoverage() bên dưới.
 *
 * Tab 4 prototype "Pattern × Block (độ phủ)" KHÔNG phải constraint_matrix (là view phái sinh).
 * → patternCoverage(): PHÁI SINH TỪ DB THẬT — mỗi pattern gộp verdict ma trận 3 theo
 *   các obligation type của nó (rank na<pos<req). Không fix cứng như prototype (bản prototype là
 *   mảng biên tập tay); số có thể khác prototype ở vài ô — ưu tiên dữ liệu thật (decision #5).
 */
@Service
public class ConstraintMatrixService {

    private final ConstraintMatrixRepository repo;
    private final MatrixCellRepository cellRepo;
    private final ObligationElementRepository elementRepo;
    private final FinancialObligationArchetypeRepository archetypeRepo;
    private final ObligationElementTypeRepository elementTypeRepo;
    private final ObligationTypeRepository obligationTypeRepo;
    private final BlockRepository blockRepo;
    private final ProductPatternRepository patternRepo;
    private final PatternObligationTypeRepository patternOtRepo;
    private final FoaElementRepository foaElementRepo;

    // 6 block "cover" của tab độ phủ (thứ tự trùng ma trận 3 prototype).
    private static final List<String> COVER_BLOCKS = List.of(
            "BLK_COUNTERPARTY", "BLK_INTEREST", "BLK_COLLATERAL", "BLK_REPAYMENT", "BLK_LIMIT", "BLK_PENALTY");

    public ConstraintMatrixService(ConstraintMatrixRepository repo,
                                   MatrixCellRepository cellRepo,
                                   ObligationElementRepository elementRepo,
                                   FinancialObligationArchetypeRepository archetypeRepo,
                                   ObligationElementTypeRepository elementTypeRepo,
                                   ObligationTypeRepository obligationTypeRepo,
                                   BlockRepository blockRepo,
                                   ProductPatternRepository patternRepo,
                                   PatternObligationTypeRepository patternOtRepo,
                                   FoaElementRepository foaElementRepo) {
        this.repo = repo;
        this.cellRepo = cellRepo;
        this.elementRepo = elementRepo;
        this.archetypeRepo = archetypeRepo;
        this.elementTypeRepo = elementTypeRepo;
        this.obligationTypeRepo = obligationTypeRepo;
        this.blockRepo = blockRepo;
        this.patternRepo = patternRepo;
        this.patternOtRepo = patternOtRepo;
        this.foaElementRepo = foaElementRepo;
    }

    /** Danh sách ma trận (cho tab bar): [{id, kind, title, description}] theo id. */
    public List<Map<String, Object>> list() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (ConstraintMatrix m : repo.findAllByOrderByIdAsc()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", m.getId());
            row.put("kind", m.getKind());
            row.put("title", m.getTitle());
            row.put("description", m.getDescription());
            out.add(row);
        }
        return out;
    }

    /** legend theo kind: compat | block (FE map ra màu + nhãn). */
    private String legendOf(String kind) {
        return switch (kind) {
            case "ELEMENTTYPE_X_ELEMENTTYPE" -> "compat";
            default -> "block"; // OBLIGATIONTYPE_X_BLOCK
        };
    }

    /** rowHead (nhãn cột đầu) theo kind. */
    private String rowHeadOf(String kind) {
        return switch (kind) {
            case "ELEMENTTYPE_X_ELEMENTTYPE" -> "OET";
            default -> "Obligation Type";
        };
    }

    /** Nhãn của một row_code theo kind (fallback về chính code). */
    private String rowLabel(String kind, String code) {
        return switch (kind) {
            case "ELEMENTTYPE_X_ELEMENTTYPE" -> elementTypeRepo.findById(code).map(e -> e.getName()).orElse(code);
            default -> obligationTypeRepo.findById(code).map(o -> o.getName()).orElse(code);
        };
    }

    /** Nhãn của một col_code theo kind (fallback về chính code). */
    private String colLabel(String kind, String code) {
        return switch (kind) {
            case "ELEMENTTYPE_X_ELEMENTTYPE" -> elementTypeRepo.findById(code).map(e -> e.getName()).orElse(code);
            default -> blockRepo.findById(code).map(b -> b.getName()).orElse(code);
        };
    }

    /**
     * Grid đầy đủ của một ma trận:
     * { matrix:{id,kind,title,description}, rowHead, legend,
     *   cols:[{code,label}], rows:[{code,label,cells:[verdict...]}] }.
     */
    public Optional<Map<String, Object>> detail(Long id) {
        return repo.findById(id).map(matrix -> {
            String kind = matrix.getKind();
            List<MatrixCell> cells = cellRepo.findByMatrixId(id);

            // Thứ tự hàng/cột theo lần-xuất-hiện-đầu-tiên (giữ layout seed).
            LinkedHashSet<String> rowCodes = new LinkedHashSet<>();
            LinkedHashSet<String> colCodes = new LinkedHashSet<>();
            Map<String, String> verdictByKey = new LinkedHashMap<>();
            for (MatrixCell c : cells) {
                rowCodes.add(c.getRowCode());
                colCodes.add(c.getColCode());
                verdictByKey.put(c.getRowCode() + "" + c.getColCode(), c.getVerdict());
            }

            List<Map<String, Object>> cols = new ArrayList<>();
            for (String cc : colCodes) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("code", cc);
                m.put("label", colLabel(kind, cc));
                cols.add(m);
            }

            List<Map<String, Object>> rows = new ArrayList<>();
            for (String rc : rowCodes) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("code", rc);
                row.put("label", rowLabel(kind, rc));
                List<String> rowCells = new ArrayList<>();
                for (String cc : colCodes) {
                    rowCells.add(verdictByKey.getOrDefault(rc + "" + cc, "na"));
                }
                row.put("cells", rowCells);
                rows.add(row);
            }

            Map<String, Object> matrixMeta = new LinkedHashMap<>();
            matrixMeta.put("id", matrix.getId());
            matrixMeta.put("kind", kind);
            matrixMeta.put("title", matrix.getTitle());
            matrixMeta.put("description", matrix.getDescription());

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("matrix", matrixMeta);
            body.put("rowHead", rowHeadOf(kind));
            body.put("legend", legendOf(kind));
            body.put("cols", cols);
            body.put("rows", rows);
            return body;
        });
    }

    private static int rank(String v) {
        return switch (v) { case "req" -> 2; case "pos" -> 1; default -> 0; };
    }
    private static String unrank(int r) {
        return r == 2 ? "req" : r == 1 ? "pos" : "na";
    }

    /**
     * Tab 4 "Pattern × Block (độ phủ)" — PHÁI SINH TỪ DB THẬT.
     * Mỗi pattern: với 6 block cover, verdict = mức mạnh nhất (na<pos<req) trong các ô
     * ma trận 3 (OBLIGATIONTYPE_X_BLOCK) ứng với các obligation type của pattern.
     * Cùng shape với detail() để FE dùng chung renderer.
     */
    public Map<String, Object> patternCoverage() {
        // Nạp ma trận 3 (OBLIGATIONTYPE_X_BLOCK).
        Long m3Id = repo.findAllByOrderByIdAsc().stream()
                .filter(m -> "OBLIGATIONTYPE_X_BLOCK".equals(m.getKind()))
                .map(ConstraintMatrix::getId)
                .findFirst().orElse(null);

        Map<String, String> otBlockVerdict = new LinkedHashMap<>(); // "OTBLK" -> verdict
        if (m3Id != null) {
            for (MatrixCell c : cellRepo.findByMatrixId(m3Id)) {
                otBlockVerdict.put(c.getRowCode() + "" + c.getColCode(), c.getVerdict());
            }
        }

        // Cột = 6 block cover (nhãn từ block.name).
        List<Map<String, Object>> cols = new ArrayList<>();
        for (String bid : COVER_BLOCKS) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", bid);
            m.put("label", blockRepo.findById(bid).map(b -> b.getName()).orElse(bid));
            cols.add(m);
        }

        // Hàng = mỗi product_pattern (sắp theo code: PT-001..).
        List<ProductPattern> patterns = new ArrayList<>(patternRepo.findAll());
        patterns.sort(Comparator.comparing(ProductPattern::getCode));

        List<Map<String, Object>> rows = new ArrayList<>();
        for (ProductPattern p : patterns) {
            List<PatternObligationType> ots = patternOtRepo.findByPatternCode(p.getCode());
            List<String> cells = new ArrayList<>();
            for (String bid : COVER_BLOCKS) {
                int best = 0; // na
                for (PatternObligationType ot : ots) {
                    String v = otBlockVerdict.get(ot.getObligationTypeCode() + "" + bid);
                    if (v != null) best = Math.max(best, rank(v));
                }
                cells.add(unrank(best));
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", p.getCode());
            row.put("label", p.getName());
            row.put("cells", cells);
            rows.add(row);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("rowHead", "Product Pattern");
        body.put("legend", "block");
        body.put("cols", cols);
        body.put("rows", rows);
        return body;
    }

    /**
     * Tab "FOA × Obligation Element" — Giai đoạn 51, PHÁI SINH TRỰC TIẾP từ foa_element
     * (nguồn duy nhất sau khi gộp bỏ constraint_matrix kind=ARCHETYPE_X_ELEMENT). Cùng shape với
     * detail()/patternCoverage() để FE dùng chung renderer.
     */
    public Map<String, Object> foaOeMatrix() {
        List<FoaElement> all = foaElementRepo.findAll();

        LinkedHashSet<String> rowCodes = new LinkedHashSet<>();
        LinkedHashSet<String> colCodes = new LinkedHashSet<>();
        Map<String, String> verdictByKey = new LinkedHashMap<>();
        for (FoaElement fe : all) {
            rowCodes.add(fe.getElementCode());
            colCodes.add(fe.getArchetypeCode());
            verdictByKey.put(fe.getElementCode() + "" + fe.getArchetypeCode(), fe.getRequirement());
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
                String v = verdictByKey.getOrDefault(rc + "" + cc, "na");
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
}
