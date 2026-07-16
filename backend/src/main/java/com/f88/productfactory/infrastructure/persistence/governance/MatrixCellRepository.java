package com.f88.productfactory.infrastructure.persistence.governance;

import com.f88.productfactory.domain.model.governance.MatrixCell;
import com.f88.productfactory.domain.model.governance.MatrixCellId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatrixCellRepository extends JpaRepository<MatrixCell, MatrixCellId> {

    /** Các ô của một ma trận (giữ thứ tự seed để dựng lưới row×col ổn định). */
    List<MatrixCell> findByMatrixId(Long matrixId);
}
