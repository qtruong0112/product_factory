package com.f88.productfactory.domain.model.attribute;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Bảng attribute — từ điển thuộc tính dùng chung (Layer II).
 * Entity read-only: không có setter nghiệp vụ, chỉ ánh xạ để đọc.
 */
@Entity
@Table(name = "attribute")
public class Attribute {

    @Id
    @Column(name = "code", length = 60)
    private String code;

    @Column(name = "name", length = 160, nullable = false)
    private String name;

    @Column(name = "group_code", length = 40, nullable = false)
    private String groupCode;

    @Column(name = "data_type_code", length = 20, nullable = false)
    private String dataTypeCode;

    @Column(name = "is_required", nullable = false)
    private boolean required;

    @Column(name = "is_unique", nullable = false)
    private boolean unique;

    @Column(name = "is_nullable", nullable = false)
    private boolean nullable;

    @Column(name = "default_value", length = 255)
    private String defaultValue;

    @Column(name = "unit", length = 40)
    private String unit;

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getGroupCode() { return groupCode; }
    public String getDataTypeCode() { return dataTypeCode; }
    public boolean isRequired() { return required; }
    public boolean isUnique() { return unique; }
    public boolean isNullable() { return nullable; }
    public String getDefaultValue() { return defaultValue; }
    public String getUnit() { return unit; }
}
