package com.f88.productfactory.domain.model.pipeline;

import jakarta.persistence.*;

/**
 * Product Pattern (Lớp III — Pipeline sản phẩm).
 * PK = code (String). Read-only: chỉ getter, không setter.
 */
@Entity
@Table(name = "product_pattern")
public class ProductPattern {

    @Id
    @Column(name = "code", length = 20)
    private String code;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    // Nullable — pattern có thể chưa gắn Product Intent nguồn.
    @Column(name = "product_intent_id")
    private Long productIntentId;

    @Column(name = "status", length = 12, nullable = false)
    private String status;

    public String getCode() { return code; }
    public String getName() { return name; }
    public Long getProductIntentId() { return productIntentId; }
    public String getStatus() { return status; }
}
