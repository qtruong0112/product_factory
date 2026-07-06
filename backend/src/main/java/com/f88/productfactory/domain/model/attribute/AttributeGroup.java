package com.f88.productfactory.domain.model.attribute;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Bảng attribute_group — nhóm attribute (Layer II). Entity read-only: chỉ getter.
 * Lưu ý: bảng KHÔNG có cột description (khác prototype UI) — không tự bịa thêm field.
 */
@Entity
@Table(name = "attribute_group")
public class AttributeGroup {

    @Id
    @Column(name = "code", length = 40)
    private String code;

    @Column(name = "name", length = 120, nullable = false)
    private String name;

    @Column(name = "domain_code", length = 40, nullable = false)
    private String domainCode;

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getDomainCode() { return domainCode; }
}
