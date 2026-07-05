package com.f88.productfactory.pipeline;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

/**
 * Product Catalog (Lớp III — Pipeline, màn cuối nhóm Pipeline sản phẩm).
 *
 * Prototype: `catalog` là CARD GRID riêng (`isCatalog`, KHÔNG nằm trong `isList`), không có
 * wizard/detail nào (`catalogForm`/`openBuilder('catalog')` — 0 kết quả khi grep bundler JS).
 * Hàm `catalog()` của prototype dựng TĨNH 6 card mẫu từ field {name, variant, family, limit,
 * rate, statusLabel, channels[]} — thực chất là join `product_variant` (family/limitRange/
 * displayRate/status) với `catalog_listing→product_catalog.channel` (distinct kênh niêm yết).
 * Không có cột/entity riêng nào của `product_catalog`/`catalog_listing` được hiển thị per-card
 * ngoài "channels" — nên endpoint trả thẳng card đã join, một dòng / variant.
 *
 * Chỉ hiện variant ĐÃ niêm yết ít nhất 1 catalog (có dòng `catalog_listing`) — khớp đúng
 * prototype (6 card, đúng bằng danh sách variant có catalog_listing: VAR-101,102,103,104,105,107;
 * VAR-106 không niêm yết catalog nào nên không xuất hiện — không phải thiếu sót).
 */
@RestController
@RequestMapping("/api/product-catalogs")
public class ProductCatalogController {

    private final ProductVariantRepository variantRepo;
    private final CatalogListingRepository listingRepo;
    private final ProductCatalogRepository catalogRepo;

    public ProductCatalogController(ProductVariantRepository variantRepo,
                                    CatalogListingRepository listingRepo,
                                    ProductCatalogRepository catalogRepo) {
        this.variantRepo = variantRepo;
        this.listingRepo = listingRepo;
        this.catalogRepo = catalogRepo;
    }

    /**
     * Danh sách card catalog (1 card / variant đã niêm yết):
     * { variantCode, name, family, limitRange, displayRate, channels, status }.
     */
    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
        List<ProductVariant> variants = new ArrayList<>(variantRepo.findAll());
        variants.sort(Comparator.comparing(ProductVariant::getCode));

        List<Map<String, Object>> rows = new ArrayList<>();
        for (ProductVariant v : variants) {
            List<CatalogListing> listings = listingRepo.findByVariantCode(v.getCode());
            if (listings.isEmpty()) continue;

            LinkedHashSet<String> channels = new LinkedHashSet<>();
            for (CatalogListing cl : listings) {
                catalogRepo.findById(cl.getCatalogId()).ifPresent(c -> channels.add(c.getChannel()));
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("variantCode", v.getCode());
            row.put("name", v.getName());
            row.put("family", v.getFamily());
            row.put("limitRange", v.getLimitRange());
            row.put("displayRate", v.getDisplayRate());
            row.put("channels", String.join(" · ", channels));
            row.put("status", v.getStatus());
            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, rows.size());
    }
}
