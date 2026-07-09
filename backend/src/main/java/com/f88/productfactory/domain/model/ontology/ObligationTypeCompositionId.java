package com.f88.productfactory.domain.model.ontology;

import java.io.Serializable;
import java.util.Objects;

public class ObligationTypeCompositionId implements Serializable {
    private String obligationTypeCode;
    private String otCoreCode;
    private String elementTypeCode;
    private String leg;

    public ObligationTypeCompositionId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ObligationTypeCompositionId that)) return false;
        return Objects.equals(obligationTypeCode, that.obligationTypeCode)
                && Objects.equals(otCoreCode, that.otCoreCode)
                && Objects.equals(elementTypeCode, that.elementTypeCode)
                && Objects.equals(leg, that.leg);
    }
    @Override public int hashCode() { return Objects.hash(obligationTypeCode, otCoreCode, elementTypeCode, leg); }
}
