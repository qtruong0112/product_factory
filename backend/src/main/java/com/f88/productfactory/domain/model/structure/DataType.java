package com.f88.productfactory.domain.model.structure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Bảng data_type — từ điển kiểu dữ liệu (Layer II).
 * PK = code (vd DT_MONEY), name = nhãn hiển thị (Money/Percent/Integer…).
 * Dùng để suy ra "type" của answer slot qua attribute.data_type_code.
 * Entity read-only.
 */
@Entity
@Table(name = "data_type")
public class DataType {

    @Id
    @Column(name = "code", length = 20)
    private String code;

    @Column(name = "name", length = 60, nullable = false)
    private String name;

    public String getCode() { return code; }
    public String getName() { return name; }
}
