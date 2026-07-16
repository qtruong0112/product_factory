package com.f88.productfactory.infrastructure.persistence.governance;

import com.f88.productfactory.domain.model.governance.ConstraintMatrix;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConstraintMatrixRepository extends JpaRepository<ConstraintMatrix, Long> {

    /** Ma trận theo thứ tự id (1,2,3) — cho tab bar. */
    List<ConstraintMatrix> findAllByOrderByIdAsc();
}
