package com.f88.productfactory.infrastructure.persistence.pipeline;

import com.f88.productfactory.domain.model.pipeline.SelectorScope;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SelectorScopeRepository extends JpaRepository<SelectorScope, String> {
}
