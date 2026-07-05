package com.f88.productfactory.pipeline;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/**
 * Bảng template_frame — giá trị khung (mặc định) mà một Product Template đặt cho một
 * Answer Slot của một Block kế thừa từ Pattern nguồn (Lớp III). Composite PK
 * (template_code, block_id, slot_code). Entity read-only.
 *
 * Chỉ những Block có ít nhất 1 dòng template_frame mới coi là "đang áp dụng" cho template đó
 * (xem ProductTemplateController#detail) — không có cột "khóa/mở" riêng trong DB.
 */
@Entity
@Table(name = "template_frame")
@IdClass(TemplateFrameId.class)
public class TemplateFrame {

    @Id
    @Column(name = "template_code", length = 20, nullable = false)
    private String templateCode;

    @Id
    @Column(name = "block_id", length = 40, nullable = false)
    private String blockId;

    @Id
    @Column(name = "slot_code", length = 60, nullable = false)
    private String slotCode;

    @Column(name = "frame_value", nullable = false)
    private String frameValue;

    public String getTemplateCode() { return templateCode; }
    public String getBlockId() { return blockId; }
    public String getSlotCode() { return slotCode; }
    public String getFrameValue() { return frameValue; }
}
