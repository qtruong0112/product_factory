package com.f88.productfactory.domain.model.governance;

import java.io.Serializable;
import java.util.Objects;

/** Khóa ghép matrix_cell (matrix_id, row_code, col_code). */
public class MatrixCellId implements Serializable {
    private Long matrixId;
    private String rowCode;
    private String colCode;

    public MatrixCellId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MatrixCellId that)) return false;
        return Objects.equals(matrixId, that.matrixId)
                && Objects.equals(rowCode, that.rowCode)
                && Objects.equals(colCode, that.colCode);
    }
    @Override public int hashCode() { return Objects.hash(matrixId, rowCode, colCode); }
}
