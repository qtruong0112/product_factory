package com.f88.productfactory.domain.model.pipeline;

import java.io.Serializable;
import java.util.Objects;

/** Khóa ghép business_intent_kpi (business_intent_id, sort_order). */
public class BusinessIntentKpiId implements Serializable {
    private Long businessIntentId;
    private Short sortOrder;

    public BusinessIntentKpiId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BusinessIntentKpiId that)) return false;
        return Objects.equals(businessIntentId, that.businessIntentId) && Objects.equals(sortOrder, that.sortOrder);
    }
    @Override public int hashCode() { return Objects.hash(businessIntentId, sortOrder); }
}
