package com.f88.productfactory.domain.model.pipeline;

import java.io.Serializable;
import java.util.Objects;

/** Khóa ghép template_segment (template_code, segment_code). */
public class TemplateSegmentId implements Serializable {
    private String templateCode;
    private String segmentCode;

    public TemplateSegmentId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TemplateSegmentId that)) return false;
        return Objects.equals(templateCode, that.templateCode)
                && Objects.equals(segmentCode, that.segmentCode);
    }
    @Override public int hashCode() { return Objects.hash(templateCode, segmentCode); }
}
