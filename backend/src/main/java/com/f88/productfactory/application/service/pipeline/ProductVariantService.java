package com.f88.productfactory.application.service.pipeline;

import com.f88.productfactory.domain.model.pipeline.CatalogListing;
import com.f88.productfactory.domain.model.pipeline.ProductConfig;
import com.f88.productfactory.domain.model.pipeline.ProductVariant;
import com.f88.productfactory.domain.repository.pipeline.CatalogListingRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductCatalogRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductConfigRepository;
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

/**
 * Product Variant (Lớp III — Pipeline).
 *
 * Prototype: `variant` nằm trong `isList` (KHÔNG có view detail/wizard riêng). Xác nhận qua
 * bundler JS: click bất kỳ dòng nào đều gọi `this.openCreate('variant')` — cùng 1 hàm, không
 * truyền dữ liệu dòng — chỉ mở drawer "Đóng gói Product Variant" (form tạo mới, placeholder
 * tĩnh). Vì vậy CHỈ dựng LIST, không có detail — giống Domain/Lifecycle/Obligation.
 *
 * Cột "KÊNH" của prototype (vd "App · Web · PGD") KHÔNG fabricate — suy ra thật từ
 * catalog_listing.variant_code → product_catalog.channel (kênh phân phối thật của variant,
 * distinct, giữ thứ tự catalog_id). Variant chưa niêm yết ở catalog nào → hiện "—".
 */
@Service
public class ProductVariantService {

    private final ProductVariantRepository repo;
    private final ProductConfigRepository configRepo;
    private final CatalogListingRepository listingRepo;
    private final ProductCatalogRepository catalogRepo;

    public ProductVariantService(ProductVariantRepository repo,
                                 ProductConfigRepository configRepo,
                                 CatalogListingRepository listingRepo,
                                 ProductCatalogRepository catalogRepo) {
        this.repo = repo;
        this.configRepo = configRepo;
        this.listingRepo = listingRepo;
        this.catalogRepo = catalogRepo;
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
}
