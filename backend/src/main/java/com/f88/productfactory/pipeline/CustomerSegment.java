package com.f88.productfactory.pipeline;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Bảng customer_segment — đối tượng khách hàng (Lớp III). Entity read-only: chỉ getter.
 * `tier` có thể NULL (không phải mọi segment đều phân hạng).
 */
@Entity
@Table(name = "customer_segment")
public class CustomerSegment {

    @Id
    @Column(name = "code", length = 40)
    private String code;

    @Column(name = "name", length = 160, nullable = false)
    private String name;

    @Column(name = "audience", nullable = false)
    private String audience;

    @Column(name = "tier")
    private String tier;

    @Column(name = "legal_requirement")
    private String legalRequirement;

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getAudience() { return audience; }
    public String getTier() { return tier; }
    public String getLegalRequirement() { return legalRequirement; }
}
