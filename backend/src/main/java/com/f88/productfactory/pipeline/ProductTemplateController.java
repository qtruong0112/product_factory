package com.f88.productfactory.pipeline;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Product Template (Lớp III — Pipeline).
 *
 * Prototype: màn LIST đơn thuần (KHÔNG phải builder — xác nhận qua `openTplWizard` luôn
 * reset `tplStep:0` bất kể dòng nào được click, tức đây là wizard TẠO MỚI chung, không phải
 * xem chi tiết một template cụ thể). Vì vậy chỉ dựng list, không có route detail — giữ nguyên
 * tinh thần các màn "list-only" đã làm (Domain, Lifecycle, Obligation).
 *
 * List cần join tên Pattern nguồn + tên Đối tượng KH (customer_segment qua template_segment)
 * — dữ liệu join, không phải cột entity — nên tự dựng Page<Map> thay vì ReadOnlyController.
 * Cột "CẬP NHẬT" của prototype KHÔNG có cột nguồn trong product_template → bỏ (quy tắc vàng).
 */
@RestController
@RequestMapping("/api/product-templates")
public class ProductTemplateController {

    private final ProductTemplateRepository repo;
    private final ProductPatternRepository patternRepo;
    private final TemplateSegmentRepository templateSegmentRepo;
    private final CustomerSegmentRepository segmentRepo;

    public ProductTemplateController(ProductTemplateRepository repo,
                                     ProductPatternRepository patternRepo,
                                     TemplateSegmentRepository templateSegmentRepo,
                                     CustomerSegmentRepository segmentRepo) {
        this.repo = repo;
        this.patternRepo = patternRepo;
        this.templateSegmentRepo = templateSegmentRepo;
        this.segmentRepo = segmentRepo;
    }

    /**
     * Danh sách Product Template (làm giàu):
     * mỗi phần tử = { code, name, fromPatternCode, patternName, segmentCode, segmentName, status }.
     */
    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
        Page<ProductTemplate> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ProductTemplate t : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", t.getCode());
            row.put("name", t.getName());
            row.put("fromPatternCode", t.getFromPatternCode());
            row.put("patternName", patternRepo.findById(t.getFromPatternCode())
                    .map(ProductPattern::getName).orElse(t.getFromPatternCode()));

            TemplateSegment seg = templateSegmentRepo.findByTemplateCode(t.getCode())
                    .stream().findFirst().orElse(null);
            String segmentCode = seg != null ? seg.getSegmentCode() : null;
            row.put("segmentCode", segmentCode);
            row.put("segmentName", segmentCode != null
                    ? segmentRepo.findById(segmentCode).map(CustomerSegment::getName).orElse(segmentCode)
                    : null);

            row.put("status", t.getStatus());
            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }
}
