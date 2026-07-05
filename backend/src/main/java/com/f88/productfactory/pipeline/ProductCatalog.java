package com.f88.productfactory.pipeline;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Bảng product_catalog — "kệ" sản phẩm theo kênh phân phối (App/Web/PGD), Lớp III — Pipeline.
 * Entity read-only.
 */
@Entity
@Table(name = "product_catalog")
public class ProductCatalog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "name", length = 120, nullable = false)
    private String name;

    @Column(name = "channel", nullable = false)
    private String channel;

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getChannel() { return channel; }
}
