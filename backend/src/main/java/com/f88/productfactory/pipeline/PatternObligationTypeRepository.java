package com.f88.productfactory.pipeline;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PatternObligationTypeRepository
        extends JpaRepository<PatternObligationType, PatternObligationTypeId> {

    List<PatternObligationType> findByPatternCode(String patternCode);
}
