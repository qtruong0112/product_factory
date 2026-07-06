package com.f88.productfactory.domain.model.pipeline;

import jakarta.persistence.*;

/**
 * Obligation Type gắn với một Pattern (junction pattern_obligation_type).
 * Composite PK (pattern_code, obligation_type_code). Read-only.
 */
@Entity
@Table(name = "pattern_obligation_type")
@IdClass(PatternObligationTypeId.class)
public class PatternObligationType {

    @Id
    @Column(name = "pattern_code", length = 20, nullable = false)
    private String patternCode;

    @Id
    @Column(name = "obligation_type_code", length = 60, nullable = false)
    private String obligationTypeCode;

    // ot_role_enum: 'Primary' | 'Support'
    @Column(name = "role", nullable = false)
    private String role;

    public String getPatternCode() { return patternCode; }
    public String getObligationTypeCode() { return obligationTypeCode; }
    public String getRole() { return role; }
}
