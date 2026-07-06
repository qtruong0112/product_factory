package com.f88.productfactory.domain.model.pipeline;

import java.io.Serializable;
import java.util.Objects;

public class PatternObligationTypeId implements Serializable {
    private String patternCode;
    private String obligationTypeCode;

    public PatternObligationTypeId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PatternObligationTypeId that)) return false;
        return Objects.equals(patternCode, that.patternCode)
                && Objects.equals(obligationTypeCode, that.obligationTypeCode);
    }
    @Override public int hashCode() { return Objects.hash(patternCode, obligationTypeCode); }
}
