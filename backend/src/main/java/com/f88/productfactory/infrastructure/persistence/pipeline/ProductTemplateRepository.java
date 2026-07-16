package com.f88.productfactory.infrastructure.persistence.pipeline;

import com.f88.productfactory.domain.model.pipeline.ProductTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductTemplateRepository extends JpaRepository<ProductTemplate, String> {
}
