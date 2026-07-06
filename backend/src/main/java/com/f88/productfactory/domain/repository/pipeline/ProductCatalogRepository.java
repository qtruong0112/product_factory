package com.f88.productfactory.domain.repository.pipeline;

import com.f88.productfactory.domain.model.pipeline.ProductCatalog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductCatalogRepository extends JpaRepository<ProductCatalog, Long> {
}
