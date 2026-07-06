package com.f88.productfactory.domain.model.structure;

import jakarta.persistence.*;

/**
 * Bảng answer_slot — "ô trả lời" thuộc một block (Layer II).
 * Composite PK (block_id, code). Mỗi slot tham chiếu một attribute_code.
 * Entity read-only.
 */
@Entity
@Table(name = "answer_slot")
@IdClass(AnswerSlotId.class)
public class AnswerSlot {

    @Id
    @Column(name = "block_id", length = 40, nullable = false)
    private String blockId;

    @Id
    @Column(name = "code", length = 60, nullable = false)
    private String code;

    @Column(name = "name", length = 160, nullable = false)
    private String name;

    @Column(name = "attribute_code", length = 60, nullable = false)
    private String attributeCode;

    @Column(name = "is_required", nullable = false)
    private boolean required;

    @Column(name = "default_value", length = 255)
    private String defaultValue;

    @Column(name = "rule_text", length = 255)
    private String ruleText;

    public String getBlockId() { return blockId; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getAttributeCode() { return attributeCode; }
    public boolean isRequired() { return required; }
    public String getDefaultValue() { return defaultValue; }
    public String getRuleText() { return ruleText; }
}
