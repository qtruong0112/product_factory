package com.f88.productfactory.domain.model.pipeline;

import java.io.Serializable;
import java.util.Objects;

/** Khóa ghép catalog_listing (catalog_id, variant_code). */
public class CatalogListingId implements Serializable {
    private Long catalogId;
    private String variantCode;

    public CatalogListingId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CatalogListingId that)) return false;
        return Objects.equals(catalogId, that.catalogId)
                && Objects.equals(variantCode, that.variantCode);
    }
    @Override public int hashCode() { return Objects.hash(catalogId, variantCode); }
}
