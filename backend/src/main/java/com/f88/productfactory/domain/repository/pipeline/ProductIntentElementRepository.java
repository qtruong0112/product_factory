package com.f88.productfactory.domain.repository.pipeline;

import com.f88.productfactory.domain.model.pipeline.ProductIntentElement;
import com.f88.productfactory.domain.model.pipeline.ProductIntentElementId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductIntentElementRepository
        extends JpaRepository<ProductIntentElement, ProductIntentElementId> {

    List<ProductIntentElement> findByProductIntentIdOrderByElementCode(Long productIntentId);
}
