package com.f88.productfactory.domain.repository.pipeline;

import com.f88.productfactory.domain.model.pipeline.PatternBlock;
import com.f88.productfactory.domain.model.pipeline.PatternBlockId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PatternBlockRepository
        extends JpaRepository<PatternBlock, PatternBlockId> {

    List<PatternBlock> findByPatternCodeOrderByPosition(String patternCode);

    long countByPatternCode(String patternCode);
}
