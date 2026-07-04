package com.f88.productfactory.pipeline;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PatternBlockRepository
        extends JpaRepository<PatternBlock, PatternBlockId> {

    List<PatternBlock> findByPatternCodeOrderByPosition(String patternCode);

    long countByPatternCode(String patternCode);
}
