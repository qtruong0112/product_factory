package com.f88.productfactory.pipeline;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TemplateFrameRepository extends JpaRepository<TemplateFrame, TemplateFrameId> {

    /** Toàn bộ giá trị khung của một template (mọi block/slot đã được đặt giá trị). */
    List<TemplateFrame> findByTemplateCode(String templateCode);
}
