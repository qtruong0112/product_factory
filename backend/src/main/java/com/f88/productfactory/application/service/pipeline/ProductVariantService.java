package com.f88.productfactory.application.service.pipeline;

import com.f88.productfactory.application.service.activity.ActivityLogService;
import com.f88.productfactory.domain.model.pipeline.CatalogListing;
import com.f88.productfactory.domain.model.pipeline.ProductCatalog;
import com.f88.productfactory.domain.model.pipeline.ProductConfig;
import com.f88.productfactory.domain.model.pipeline.ProductPattern;
import com.f88.productfactory.domain.model.pipeline.ProductTemplate;
import com.f88.productfactory.domain.model.pipeline.ProductVariant;
import com.f88.productfactory.domain.repository.pipeline.CatalogListingRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductCatalogRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductConfigRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductPatternRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductTemplateRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductVariantRepository;
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

/**
 * Product Variant (Lớp III — Pipeline).
 *
 * Prototype: `variant` nằm trong `isList` (KHÔNG có view detail/wizard riêng) — click bất kỳ
 * dòng nào chỉ mở drawer tạo mới dùng chung, không truyền id. Giai đoạn 36: theo yêu cầu user
 * ("làm màn detail thật chi tiết"), bổ sung {@link #detail(String)} — UI mới ngoài prototype,
 * cùng tinh thần với Lifecycle/Domain/Block (Giai đoạn 34-35): mọi field đều join thật, không bịa.
 *
 * Cột "KÊNH" của prototype (vd "App · Web · PGD") KHÔNG fabricate — suy ra thật từ
 * catalog_listing.variant_code → product_catalog.channel (kênh phân phối thật của variant,
 * distinct, giữ thứ tự catalog_id). Variant chưa niêm yết ở catalog nào → hiện "—".
 */
@Service
public class ProductVariantService {

    private final ProductVariantRepository repo;
    private final ProductConfigRepository configRepo;
    private final ProductTemplateRepository templateRepo;
    private final ProductPatternRepository patternRepo;
    private final CatalogListingRepository listingRepo;
    private final ProductCatalogRepository catalogRepo;
    private final ActivityLogService activityLogService;

    public ProductVariantService(ProductVariantRepository repo,
                                 ProductConfigRepository configRepo,
                                 ProductTemplateRepository templateRepo,
                                 ProductPatternRepository patternRepo,
                                 CatalogListingRepository listingRepo,
                                 ProductCatalogRepository catalogRepo,
                                 ActivityLogService activityLogService) {
        this.repo = repo;
        this.configRepo = configRepo;
        this.templateRepo = templateRepo;
        this.patternRepo = patternRepo;
        this.listingRepo = listingRepo;
        this.catalogRepo = catalogRepo;
        this.activityLogService = activityLogService;
    }

    /**
     * Danh sách Product Variant (làm giàu):
     * mỗi phần tử = { code, name, fromConfigCode, configName, limitRange, displayRate, channels, status }.
     */
    public Page<Map<String, Object>> list(Pageable pageable) {
        Page<ProductVariant> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ProductVariant v : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", v.getCode());
            row.put("name", v.getName());
            row.put("fromConfigCode", v.getFromConfigCode());
            row.put("configName", configRepo.findById(v.getFromConfigCode())
                    .map(ProductConfig::getName).orElse(v.getFromConfigCode()));
            row.put("limitRange", v.getLimitRange());
            row.put("displayRate", v.getDisplayRate());

            // Kênh phân phối thật: distinct product_catalog.channel qua catalog_listing.
            LinkedHashSet<String> channels = new LinkedHashSet<>();
            for (CatalogListing cl : listingRepo.findByVariantCode(v.getCode())) {
                catalogRepo.findById(cl.getCatalogId()).ifPresent(c -> channels.add(c.getChannel()));
            }
            row.put("channels", channels.isEmpty() ? null : String.join(" · ", channels));

            row.put("status", v.getStatus());
            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /**
     * Chi tiết đầy đủ 1 Product Variant:
     * { variant, pattern, template, config, listings:[{catalogId,catalogName,channel,publishedDate,status}],
     *   activity:[...] } — lineage Pattern→Template→Config→Variant, niêm yết Catalog, nhật ký hoạt động
     * riêng của variant này. Mọi field join thật từ DB, không bịa.
     */
    public Optional<Map<String, Object>> detail(String code) {
        return repo.findById(code).map(variant -> {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("variant", variant);

            Optional<ProductConfig> config = configRepo.findById(variant.getFromConfigCode());
            Optional<ProductTemplate> template = config.flatMap(c -> templateRepo.findById(c.getFromTemplateCode()));
            Optional<ProductPattern> pattern = template.flatMap(t -> patternRepo.findById(t.getFromPatternCode()));
            result.put("config", config.orElse(null));
            result.put("template", template.orElse(null));
            result.put("pattern", pattern.orElse(null));

            List<Map<String, Object>> listings = new ArrayList<>();
            for (CatalogListing cl : listingRepo.findByVariantCode(code)) {
                Optional<ProductCatalog> catalog = catalogRepo.findById(cl.getCatalogId());
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("catalogId", cl.getCatalogId());
                m.put("catalogName", catalog.map(ProductCatalog::getName).orElse(null));
                m.put("channel", catalog.map(ProductCatalog::getChannel).orElse(null));
                m.put("publishedDate", cl.getPublishedDate());
                m.put("status", cl.getStatus());
                listings.add(m);
            }
            result.put("listings", listings);

            result.put("activity", activityLogService.forEntity("ProductVariant", code));

            return result;
        });
    }
}
