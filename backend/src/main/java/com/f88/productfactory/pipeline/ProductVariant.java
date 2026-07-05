package com.f88.productfactory.pipeline;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Bảng product_variant — đóng gói một Product Config đã duyệt thành sản phẩm xuất bản
 * (Lớp III — Pipeline). Entity read-only.
 */
@Entity
@Table(name = "product_variant")
public class ProductVariant {

    @Id
    @Column(name = "code", length = 20)
    private String code;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "from_config_code", length = 20, nullable = false)
    private String fromConfigCode;

    @Column(name = "family", length = 40)
    private String family;

    @Column(name = "limit_range", length = 60)
    private String limitRange;

    @Column(name = "display_rate", length = 40)
    private String displayRate;

    @Column(name = "marketing_content")
    private String marketingContent;

    @Column(name = "status", nullable = false)
    private String status;

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getFromConfigCode() { return fromConfigCode; }
    public String getFamily() { return family; }
    public String getLimitRange() { return limitRange; }
    public String getDisplayRate() { return displayRate; }
    public String getMarketingContent() { return marketingContent; }
    public String getStatus() { return status; }
}
