package com.f88.productfactory.governance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Bảng constraint_matrix — định nghĩa một ma trận ràng buộc (Lớp IV).
 * kind (matrix_kind_enum): ARCHETYPE_X_ELEMENT | ELEMENTTYPE_X_ELEMENTTYPE | OBLIGATIONTYPE_X_BLOCK.
 * Enum map @Column String (theo tiền lệ dự án). Entity read-only.
 */
@Entity
@Table(name = "constraint_matrix")
public class ConstraintMatrix {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "kind", nullable = false)
    private String kind;

    @Column(name = "title", length = 200, nullable = false)
    private String title;

    @Column(name = "description")
    private String description;

    public Long getId() { return id; }
    public String getKind() { return kind; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
}
