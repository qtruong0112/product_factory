package com.f88.productfactory.attribute;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Bảng domain — miền dữ liệu (Layer II). Entity read-only: chỉ getter.
 */
@Entity
@Table(name = "domain")
public class Domain {

    @Id
    @Column(name = "code", length = 40)
    private String code;

    @Column(name = "name", length = 120, nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "entity_count")
    private Integer entityCount;

    @Column(name = "status", length = 20, nullable = false)
    private String status;

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Integer getEntityCount() { return entityCount; }
    public String getStatus() { return status; }
}
