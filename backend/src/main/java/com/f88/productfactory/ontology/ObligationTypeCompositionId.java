package com.f88.productfactory.ontology;

import java.io.Serializable;
import java.util.Objects;

public class ObligationTypeCompositionId implements Serializable {
    private String obligationTypeCode;
    private String elementTypeCode;

    public ObligationTypeCompositionId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ObligationTypeCompositionId that)) return false;
        return Objects.equals(obligationTypeCode, that.obligationTypeCode) && Objects.equals(elementTypeCode, that.elementTypeCode);
    }
    @Override public int hashCode() { return Objects.hash(obligationTypeCode, elementTypeCode); }
}
