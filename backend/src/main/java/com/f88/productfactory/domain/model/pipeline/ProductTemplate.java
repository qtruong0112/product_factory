package com.f88.productfactory.domain.model.pipeline;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Bảng product_template — cụ thể hóa một Product Pattern cho một đối tượng khách hàng
 * (Lớp III — Pipeline). Entity read-only: chỉ getter.
 */
@Entity
@Table(name = "product_template")
public class ProductTemplate {

    @Id
    @Column(name = "code", length = 20)
    private String code;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "from_pattern_code", length = 20, nullable = false)
    private String fromPatternCode;

    @Column(name = "status", nullable = false)
    private String status;

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getFromPatternCode() { return fromPatternCode; }
    public String getStatus() { return status; }
}
