package com.f88.productfactory.domain.model.pipeline;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.time.LocalDate;

/**
 * Bảng catalog_listing — junction Product Catalog × Product Variant (Lớp III — Pipeline).
 * Composite PK (catalog_id, variant_code). Entity read-only.
 */
@Entity
@Table(name = "catalog_listing")
@IdClass(CatalogListingId.class)
public class CatalogListing {

    @Id
    @Column(name = "catalog_id", nullable = false)
    private Long catalogId;

    @Id
    @Column(name = "variant_code", length = 20, nullable = false)
    private String variantCode;

    @Column(name = "published_date")
    private LocalDate publishedDate;

    @Column(name = "status", nullable = false)
    private String status;

    public Long getCatalogId() { return catalogId; }
    public String getVariantCode() { return variantCode; }
    public LocalDate getPublishedDate() { return publishedDate; }
    public String getStatus() { return status; }
}
