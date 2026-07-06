package com.f88.productfactory.domain.model.pipeline;

import jakarta.persistence.*;

/**
 * Product Intent (Lớp III — Pipeline sản phẩm).
 * Read-only: chỉ getter, không setter.
 */
@Entity
@Table(name = "product_intent")
public class ProductIntent {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "code", length = 20)
    private String code;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "business_intent_id", nullable = false)
    private Long businessIntentId;

    @Column(name = "nature_element_code", length = 60, nullable = false)
    private String natureElementCode;

    @Column(name = "archetype_code", length = 30, nullable = false)
    private String archetypeCode;

    @Column(name = "status", length = 12, nullable = false)
    private String status;

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public Long getBusinessIntentId() { return businessIntentId; }
    public String getNatureElementCode() { return natureElementCode; }
    public String getArchetypeCode() { return archetypeCode; }
    public String getStatus() { return status; }
}
