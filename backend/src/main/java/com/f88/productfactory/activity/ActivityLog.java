package com.f88.productfactory.activity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Bảng activity_log — nhật ký mọi thao tác ghi vết (Lớp IV — Governance). Entity read-only.
 */
@Entity
@Table(name = "activity_log")
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @Column(name = "actor", length = 120, nullable = false)
    private String actor;

    @Column(name = "action", length = 40, nullable = false)
    private String action;

    @Column(name = "entity_type", length = 60, nullable = false)
    private String entityType;

    @Column(name = "entity_code", length = 60)
    private String entityCode;

    @Column(name = "detail")
    private String detail;

    public Long getId() { return id; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
    public String getActor() { return actor; }
    public String getAction() { return action; }
    public String getEntityType() { return entityType; }
    public String getEntityCode() { return entityCode; }
    public String getDetail() { return detail; }
}
