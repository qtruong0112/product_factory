package com.f88.productfactory.ontology;

import java.io.Serializable;
import java.util.Objects;

public class LifecycleStateId implements Serializable {
    private String lifecycleCode;
    private Short sortOrder;

    public LifecycleStateId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof LifecycleStateId that)) return false;
        return Objects.equals(lifecycleCode, that.lifecycleCode) && Objects.equals(sortOrder, that.sortOrder);
    }
    @Override public int hashCode() { return Objects.hash(lifecycleCode, sortOrder); }
}
