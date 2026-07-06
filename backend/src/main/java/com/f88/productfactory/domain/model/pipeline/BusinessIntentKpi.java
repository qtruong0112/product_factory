package com.f88.productfactory.domain.model.pipeline;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/**
 * Bảng business_intent_kpi — KPI đo lường của 1 Business Intent. Composite PK
 * (business_intent_id, sort_order). Entity read-only, chỉ getter.
 */
@Entity
@Table(name = "business_intent_kpi")
@IdClass(BusinessIntentKpiId.class)
public class BusinessIntentKpi {

    @Id
    @Column(name = "business_intent_id", nullable = false)
    private Long businessIntentId;

    @Id
    @Column(name = "sort_order", nullable = false)
    private Short sortOrder;

    @Column(name = "metric", length = 160, nullable = false)
    private String metric;

    @Column(name = "target", length = 80, nullable = false)
    private String target;

    @Column(name = "unit", length = 40)
    private String unit;

    public Long getBusinessIntentId() { return businessIntentId; }
    public Short getSortOrder() { return sortOrder; }
    public String getMetric() { return metric; }
    public String getTarget() { return target; }
    public String getUnit() { return unit; }
}
