package com.f88.productfactory.infrastructure.persistence.pipeline;

import com.f88.productfactory.domain.model.pipeline.CatalogListing;
import com.f88.productfactory.domain.model.pipeline.CatalogListingId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CatalogListingRepository extends JpaRepository<CatalogListing, CatalogListingId> {

    /** Các catalog niêm yết một variant (giữ thứ tự seed để tính kênh phân phối). */
    List<CatalogListing> findByVariantCode(String variantCode);
}
