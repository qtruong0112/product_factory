package com.f88.productfactory.pipeline;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PatternObligationTypeRepository
        extends JpaRepository<PatternObligationType, PatternObligationTypeId> {

    List<PatternObligationType> findByPatternCode(String patternCode);

    /** Pattern nào đang dùng một Obligation Type — cho màn Archetype detail (đếm sản phẩm). */
    List<PatternObligationType> findByObligationTypeCode(String obligationTypeCode);
}
