package com.f88.productfactory.domain.repository.pipeline;

import com.f88.productfactory.domain.model.pipeline.TemplateSegment;
import com.f88.productfactory.domain.model.pipeline.TemplateSegmentId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TemplateSegmentRepository extends JpaRepository<TemplateSegment, TemplateSegmentId> {

    /** Các segment gán cho một template (thường chỉ 1, theo seed). */
    List<TemplateSegment> findByTemplateCode(String templateCode);
}
