package com.f88.productfactory.infrastructure.persistence.pipeline;

import com.f88.productfactory.domain.model.pipeline.TemplateFrame;
import com.f88.productfactory.domain.model.pipeline.TemplateFrameId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TemplateFrameRepository extends JpaRepository<TemplateFrame, TemplateFrameId> {

    /** Toàn bộ giá trị khung của một template (mọi block/slot đã được đặt giá trị). */
    List<TemplateFrame> findByTemplateCode(String templateCode);

    /** Các template đã đặt giá trị khung cho một slot cụ thể — dùng cho lineage Attribute Usage. */
    List<TemplateFrame> findByBlockIdAndSlotCode(String blockId, String slotCode);
}
