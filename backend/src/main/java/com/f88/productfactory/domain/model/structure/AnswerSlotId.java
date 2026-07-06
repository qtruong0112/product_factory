package com.f88.productfactory.domain.model.structure;

import java.io.Serializable;
import java.util.Objects;

/** Khóa ghép answer_slot (block_id, code). */
public class AnswerSlotId implements Serializable {
    private String blockId;
    private String code;

    public AnswerSlotId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AnswerSlotId that)) return false;
        return Objects.equals(blockId, that.blockId)
                && Objects.equals(code, that.code);
    }
    @Override public int hashCode() { return Objects.hash(blockId, code); }
}
