package com.f88.productfactory.domain.model.pipeline;

import jakarta.persistence.*;

/**
 * Element nền của một Product Intent (junction product_intent_element), đủ cấu trúc OT lõi/leg
 * (Giai đoạn 66 — mirror obligation_type_composition) để phân biệt OE thuộc OT lõi Cốt lõi hay
 * Phụ trợ. Composite PK (product_intent_id, ot_core_code, element_type_code, leg). Read-only.
 */
@Entity
@Table(name = "product_intent_element")
@IdClass(ProductIntentElementId.class)
public class ProductIntentElement {

    @Id
    @Column(name = "product_intent_id", nullable = false)
    private Long productIntentId;

    @Id
    @Column(name = "ot_core_code", length = 30, nullable = false)
    private String otCoreCode;

    @Id
    @Column(name = "element_type_code", length = 30, nullable = false)
    private String elementTypeCode;

    @Id
    @Column(name = "leg", length = 20, nullable = false)
    private String leg;

    @Column(name = "element_code", length = 60, nullable = false)
    private String elementCode;

    public Long getProductIntentId() { return productIntentId; }
    public String getOtCoreCode() { return otCoreCode; }
    public String getElementTypeCode() { return elementTypeCode; }
    public String getLeg() { return leg; }
    public String getElementCode() { return elementCode; }
}
