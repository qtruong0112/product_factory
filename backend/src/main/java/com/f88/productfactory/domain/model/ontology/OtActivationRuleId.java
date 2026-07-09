package com.f88.productfactory.domain.model.ontology;

import java.io.Serializable;
import java.util.Objects;

public class OtActivationRuleId implements Serializable {
    private String triggerElementCode;
    private String activatedOtCoreCode;

    public OtActivationRuleId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof OtActivationRuleId that)) return false;
        return Objects.equals(triggerElementCode, that.triggerElementCode) && Objects.equals(activatedOtCoreCode, that.activatedOtCoreCode);
    }
    @Override public int hashCode() { return Objects.hash(triggerElementCode, activatedOtCoreCode); }
}
