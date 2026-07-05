package com.f88.productfactory.version;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Bảng version_entry — lịch sử phiên bản polymorphic của Pattern/Template/Config
 * (rel #24, versioning maker–checker). Entity read-only.
 */
@Entity
@Table(name = "version_entry")
public class VersionEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_code", length = 20, nullable = false)
    private String entityCode;

    @Column(name = "version", length = 12, nullable = false)
    private String version;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "is_head", nullable = false)
    private boolean head;

    @Column(name = "author", length = 120, nullable = false)
    private String author;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "note")
    private String note;

    public Long getId() { return id; }
    public String getEntityType() { return entityType; }
    public String getEntityCode() { return entityCode; }
    public String getVersion() { return version; }
    public String getStatus() { return status; }
    public boolean isActive() { return active; }
    public boolean isHead() { return head; }
    public String getAuthor() { return author; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getNote() { return note; }
}
