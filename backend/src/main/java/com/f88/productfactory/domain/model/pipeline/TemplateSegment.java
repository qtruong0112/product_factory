package com.f88.productfactory.domain.model.pipeline;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/**
 * Bảng template_segment — junction Product Template × Customer Segment (Lớp III).
 * Composite PK (template_code, segment_code). Entity read-only.
 */
@Entity
@Table(name = "template_segment")
@IdClass(TemplateSegmentId.class)
public class TemplateSegment {

    @Id
    @Column(name = "template_code", length = 20, nullable = false)
    private String templateCode;

    @Id
    @Column(name = "segment_code", length = 40, nullable = false)
    private String segmentCode;

    public String getTemplateCode() { return templateCode; }
    public String getSegmentCode() { return segmentCode; }
}
