package com.f88.productfactory.pipeline;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Bảng selector_scope — thứ tự ưu tiên ghi đè giá trị Fragment theo bối cảnh
 * (default < time < place < people, seed priority 0..3). Entity read-only.
 */
@Entity
@Table(name = "selector_scope")
public class SelectorScope {

    @Id
    @Column(name = "code", length = 10)
    private String code;

    @Column(name = "name", length = 60, nullable = false)
    private String name;

    @Column(name = "priority", nullable = false)
    private Short priority;

    public String getCode() { return code; }
    public String getName() { return name; }
    public Short getPriority() { return priority; }
}
