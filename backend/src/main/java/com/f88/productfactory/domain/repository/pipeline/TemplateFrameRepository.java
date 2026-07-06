package com.f88.productfactory.domain.repository.pipeline;

import com.f88.productfactory.domain.model.pipeline.TemplateFrame;
import com.f88.productfactory.domain.model.pipeline.TemplateFrameId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TemplateFrameRepository extends JpaRepository<TemplateFrame, TemplateFrameId> {

    /** Toàn bộ giá trị khung của một template (mọi block/slot đã được đặt giá trị). */
    List<TemplateFrame> findByTemplateCode(String templateCode);
}
