package com.f88.productfactory.domain.model.pipeline;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Bảng product_config — cụ thể hóa một Product Template thành cấu hình có giá trị thật
 * theo bối cảnh (Lớp III — Pipeline). Entity read-only.
 */
@Entity
@Table(name = "product_config")
public class ProductConfig {

    @Id
    @Column(name = "code", length = 20)
    private String code;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "from_template_code", length = 20, nullable = false)
    private String fromTemplateCode;

    @Column(name = "status", nullable = false)
    private String status;

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getFromTemplateCode() { return fromTemplateCode; }
    public String getStatus() { return status; }
}
