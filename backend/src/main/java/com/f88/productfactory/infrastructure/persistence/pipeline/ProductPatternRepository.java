package com.f88.productfactory.infrastructure.persistence.pipeline;

import com.f88.productfactory.domain.model.pipeline.ProductPattern;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductPatternRepository extends JpaRepository<ProductPattern, String> {
}
