package com.f88.productfactory.domain.model.pipeline;

import java.io.Serializable;
import java.util.Objects;

/** Khóa ghép template_frame (template_code, block_id, slot_code). */
public class TemplateFrameId implements Serializable {
    private String templateCode;
    private String blockId;
    private String slotCode;

    public TemplateFrameId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TemplateFrameId that)) return false;
        return Objects.equals(templateCode, that.templateCode)
                && Objects.equals(blockId, that.blockId)
                && Objects.equals(slotCode, that.slotCode);
    }
    @Override public int hashCode() { return Objects.hash(templateCode, blockId, slotCode); }
}
