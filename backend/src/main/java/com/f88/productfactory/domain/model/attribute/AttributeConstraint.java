package com.f88.productfactory.domain.model.attribute;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * Bảng attribute_constraint — ràng buộc của attribute (Layer II). Entity read-only: chỉ getter.
 */
@Entity
@Table(name = "attribute_constraint")
public class AttributeConstraint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "attribute_code", length = 60, nullable = false)
    private String attributeCode;

    @Column(name = "kind", length = 20, nullable = false)
    private String kind;

    @Column(name = "min_value")
    private BigDecimal minValue;

    @Column(name = "max_value")
    private BigDecimal maxValue;

    @Column(name = "step_value")
    private BigDecimal stepValue;

    @Column(name = "expression")
    private String expression;

    @Column(name = "depends_on_attribute_code", length = 60)
    private String dependsOnAttributeCode;

    @Column(name = "message")
    private String message;

    public Long getId() { return id; }
    public String getAttributeCode() { return attributeCode; }
    public String getKind() { return kind; }
    public BigDecimal getMinValue() { return minValue; }
    public BigDecimal getMaxValue() { return maxValue; }
    public BigDecimal getStepValue() { return stepValue; }
    public String getExpression() { return expression; }
    public String getDependsOnAttributeCode() { return dependsOnAttributeCode; }
    public String getMessage() { return message; }
}
