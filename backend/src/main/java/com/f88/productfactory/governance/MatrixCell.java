package com.f88.productfactory.governance;

import jakarta.persistence.*;

/**
 * Bảng matrix_cell — một ô của ma trận (Lớp IV).
 * Composite PK (matrix_id, row_code, col_code). verdict (matrix_verdict_enum): req | pos | na.
 * Ghi chú: UI hiển thị 'na' bằng nhãn "Không / Không dùng / Xung đột" (tùy legend).
 * Entity read-only.
 */
@Entity
@Table(name = "matrix_cell")
@IdClass(MatrixCellId.class)
public class MatrixCell {

    @Id
    @Column(name = "matrix_id", nullable = false)
    private Long matrixId;

    @Id
    @Column(name = "row_code", length = 60, nullable = false)
    private String rowCode;

    @Id
    @Column(name = "col_code", length = 60, nullable = false)
    private String colCode;

    @Column(name = "verdict", nullable = false)
    private String verdict;

    @Column(name = "is_override", nullable = false)
    private boolean override;

    public Long getMatrixId() { return matrixId; }
    public String getRowCode() { return rowCode; }
    public String getColCode() { return colCode; }
    public String getVerdict() { return verdict; }
    public boolean isOverride() { return override; }
}
