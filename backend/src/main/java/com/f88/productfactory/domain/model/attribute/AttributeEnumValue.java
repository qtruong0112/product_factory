package com.f88.productfactory.domain.model.attribute;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/**
 * Bảng attribute_enum_value — giá trị enum của attribute kiểu DT_ENUM (Layer II).
 * Composite PK (attribute_code, sort_order). Entity read-only: chỉ getter.
 */
@Entity
@Table(name = "attribute_enum_value")
@IdClass(AttributeEnumValueId.class)
public class AttributeEnumValue {

    @Id
    @Column(name = "attribute_code", length = 60, nullable = false)
    private String attributeCode;

    @Id
    @Column(name = "sort_order", nullable = false)
    private Short sortOrder;

    @Column(name = "value", length = 160, nullable = false)
    private String value;

    public String getAttributeCode() { return attributeCode; }
    public Short getSortOrder() { return sortOrder; }
    public String getValue() { return value; }
}
