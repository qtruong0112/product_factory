package com.f88.productfactory.domain.model.structure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Bảng block — thư viện "khối cấu trúc" (Layer II).
 * PK = id (vd BLK_ELIGIBILITY), code UNIQUE (vd BLOCK_ELIGIBILITY).
 * biz_group (biz_group_enum: Khởi tạo/Giá trị/Kích hoạt/Vận hành/Thu hồi) map bằng @Column String
 * (theo tiền lệ enum PG trong dự án — không dùng @Enumerated).
 * "Chi phối bởi" (gov) = governed_by_element_code, fallback governed_by_aspect (một trong hai NULL).
 * Entity read-only.
 */
@Entity
@Table(name = "block")
public class Block {

    @Id
    @Column(name = "id", length = 40)
    private String id;

    @Column(name = "code", length = 60, nullable = false)
    private String code;

    @Column(name = "name", length = 160, nullable = false)
    private String name;

    @Column(name = "biz_group", nullable = false)
    private String bizGroup;

    @Column(name = "governed_by_element_code", length = 60)
    private String governedByElementCode;

    @Column(name = "governed_by_aspect", length = 80)
    private String governedByAspect;

    @Column(name = "status", nullable = false)
    private String status;

    public String getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getBizGroup() { return bizGroup; }
    public String getGovernedByElementCode() { return governedByElementCode; }
    public String getGovernedByAspect() { return governedByAspect; }
    public String getStatus() { return status; }

    /** "Chi phối bởi": ưu tiên element code, nếu null thì aspect. */
    public String getGov() {
        return governedByElementCode != null ? governedByElementCode : governedByAspect;
    }
}
