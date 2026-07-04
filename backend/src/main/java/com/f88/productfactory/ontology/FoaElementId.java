package com.f88.productfactory.ontology;

import java.io.Serializable;
import java.util.Objects;

public class FoaElementId implements Serializable {
    private String archetypeCode;
    private String elementCode;

    public FoaElementId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FoaElementId that)) return false;
        return Objects.equals(archetypeCode, that.archetypeCode) && Objects.equals(elementCode, that.elementCode);
    }
    @Override public int hashCode() { return Objects.hash(archetypeCode, elementCode); }
}
