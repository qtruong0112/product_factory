package com.f88.productfactory.domain.model.pipeline;

import jakarta.persistence.*;

/**
 * Block thuộc một Pattern (junction pattern_block, canvas có thứ tự).
 * Composite PK (pattern_code, block_id). Read-only.
 */
@Entity
@Table(name = "pattern_block")
@IdClass(PatternBlockId.class)
public class PatternBlock {

    @Id
    @Column(name = "pattern_code", length = 20, nullable = false)
    private String patternCode;

    @Id
    @Column(name = "block_id", length = 40, nullable = false)
    private String blockId;

    @Column(name = "position", nullable = false)
    private Short position;

    // block_usage_enum: 'active' | 'locked'
    @Column(name = "usage", nullable = false)
    private String usage;

    public String getPatternCode() { return patternCode; }
    public String getBlockId() { return blockId; }
    public Short getPosition() { return position; }
    public String getUsage() { return usage; }
}
