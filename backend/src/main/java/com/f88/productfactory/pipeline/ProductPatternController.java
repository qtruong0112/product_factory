package com.f88.productfactory.pipeline;

import com.f88.productfactory.ontology.ObligationTypeRepository;
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

    private final ProductPatternRepository repo;
    private final PatternBlockRepository blockRepo;
    private final PatternObligationTypeRepository obligationRepo;
    private final ProductIntentRepository productIntentRepo;
    private final ObligationTypeRepository obligationTypeRepo;

    public ProductPatternController(ProductPatternRepository repo,
                                    PatternBlockRepository blockRepo,
                                    PatternObligationTypeRepository obligationRepo,
                                    ProductIntentRepository productIntentRepo,
                                    ObligationTypeRepository obligationTypeRepo) {
        this.repo = repo;
        this.blockRepo = blockRepo;
        this.obligationRepo = obligationRepo;
        this.productIntentRepo = productIntentRepo;
        this.obligationTypeRepo = obligationTypeRepo;
    }

    /** Tên obligation_type từ code (fallback về chính code nếu chưa có bản ghi). */
    private String obligationTypeName(String code) {
        return obligationTypeRepo.findById(code)
                .map(ot -> ot.getName())
                .orElse(code);
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
     * Chi tiết đầy đủ:
     * { pattern, productIntentName, blocks:[{blockId,position,usage}], obligationTypes:[{code,name,role}] }.
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

            // Block theo thứ tự position.
            List<Map<String, Object>> blocks = new ArrayList<>();
            for (PatternBlock b : blockRepo.findByPatternCodeOrderByPosition(code)) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("blockId", b.getBlockId());
                m.put("position", b.getPosition());
                m.put("usage", b.getUsage());
                blocks.add(m);
            }
            body.put("blocks", blocks);

            // Obligation type kèm tên + role.
            List<Map<String, Object>> ots = new ArrayList<>();
            for (PatternObligationType ot : obligationRepo.findByPatternCode(code)) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("code", ot.getObligationTypeCode());
                m.put("name", obligationTypeName(ot.getObligationTypeCode()));
                m.put("role", ot.getRole());
                ots.add(m);
            }
            body.put("obligationTypes", ots);

            return ResponseEntity.ok(body);
        }).orElse(ResponseEntity.notFound().build());
    }
}
