package com.f88.productfactory.domain.model.pipeline;

import jakarta.persistence.*;

/**
 * Element nền của một Product Intent (junction product_intent_element).
 * Composite PK (product_intent_id, element_code). Read-only.
 */
@Entity
@Table(name = "product_intent_element")
@IdClass(ProductIntentElementId.class)
public class ProductIntentElement {

    @Id
    @Column(name = "product_intent_id", nullable = false)
    private Long productIntentId;

    @Id
    @Column(name = "element_code", length = 60, nullable = false)
    private String elementCode;

    public Long getProductIntentId() { return productIntentId; }
    public String getElementCode() { return elementCode; }
}
