package com.f88.productfactory.pipeline;

import java.io.Serializable;
import java.util.Objects;

public class PatternBlockId implements Serializable {
    private String patternCode;
    private String blockId;

    public PatternBlockId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PatternBlockId that)) return false;
        return Objects.equals(patternCode, that.patternCode)
                && Objects.equals(blockId, that.blockId);
    }
    @Override public int hashCode() { return Objects.hash(patternCode, blockId); }
}
