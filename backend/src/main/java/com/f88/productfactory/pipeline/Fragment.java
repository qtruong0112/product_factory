package com.f88.productfactory.pipeline;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Bảng fragment — giá trị thật của một Answer Slot trong một Product Config, theo bối cảnh
 * (selector_scope + scope_value). Một slot có thể có nhiều fragment (default, rồi ghi đè theo
 * time/place/people) — độ ưu tiên ghi đè lấy từ `selector_scope.priority`. Entity read-only.
 */
@Entity
@Table(name = "fragment")
public class Fragment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "config_code", length = 20, nullable = false)
    private String configCode;

    @Column(name = "block_id", length = 40, nullable = false)
    private String blockId;

    @Column(name = "slot_code", length = 60, nullable = false)
    private String slotCode;

    @Column(name = "scope_code", length = 10, nullable = false)
    private String scopeCode;

    @Column(name = "scope_value", length = 120)
    private String scopeValue;

    @Column(name = "value", nullable = false)
    private String value;

    @Column(name = "is_warning", nullable = false)
    private boolean warning;

    @Column(name = "validation_msg")
    private String validationMsg;

    public Long getId() { return id; }
    public String getConfigCode() { return configCode; }
    public String getBlockId() { return blockId; }
    public String getSlotCode() { return slotCode; }
    public String getScopeCode() { return scopeCode; }
    public String getScopeValue() { return scopeValue; }
    public String getValue() { return value; }
    public boolean isWarning() { return warning; }
    public String getValidationMsg() { return validationMsg; }
}
