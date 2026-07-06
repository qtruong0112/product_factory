package com.f88.productfactory.domain.repository.pipeline;

import com.f88.productfactory.domain.model.pipeline.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, String> {

    /** Variant xuất bản từ một tập config — dùng cho lineage Attribute Usage. */
    List<ProductVariant> findByFromConfigCodeIn(List<String> configCodes);
}
