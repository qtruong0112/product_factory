package com.f88.productfactory.domain.model.pipeline;

import java.io.Serializable;
import java.util.Objects;

public class ProductIntentElementId implements Serializable {
    private Long productIntentId;
    private String otCoreCode;
    private String elementTypeCode;
    private String leg;

    public ProductIntentElementId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProductIntentElementId that)) return false;
        return Objects.equals(productIntentId, that.productIntentId)
                && Objects.equals(otCoreCode, that.otCoreCode)
                && Objects.equals(elementTypeCode, that.elementTypeCode)
                && Objects.equals(leg, that.leg);
    }
    @Override public int hashCode() { return Objects.hash(productIntentId, otCoreCode, elementTypeCode, leg); }
}
