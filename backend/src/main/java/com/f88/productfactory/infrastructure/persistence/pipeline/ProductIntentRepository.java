package com.f88.productfactory.infrastructure.persistence.pipeline;

import com.f88.productfactory.domain.model.pipeline.ProductIntent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductIntentRepository extends JpaRepository<ProductIntent, Long> {
}
