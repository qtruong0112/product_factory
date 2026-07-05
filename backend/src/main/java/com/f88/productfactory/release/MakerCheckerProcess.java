package com.f88.productfactory.release;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Bảng maker_checker_process — Quy trình phê duyệt 8 bước (Release). Entity read-only.
 */
@Entity
@Table(name = "maker_checker_process")
public class MakerCheckerProcess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "variant_code", length = 20)
    private String variantCode;

    @Column(name = "product_name", length = 200, nullable = false)
    private String productName;

    @Column(name = "done_count", nullable = false)
    private Short doneCount;

    public Long getId() { return id; }
    public String getVariantCode() { return variantCode; }
    public String getProductName() { return productName; }
    public Short getDoneCount() { return doneCount; }
}
