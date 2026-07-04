package com.f88.productfactory.pipeline;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductIntentElementRepository
        extends JpaRepository<ProductIntentElement, ProductIntentElementId> {

    List<ProductIntentElement> findByProductIntentIdOrderByElementCode(Long productIntentId);
}
