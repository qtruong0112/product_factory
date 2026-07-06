package com.f88.productfactory.domain.repository.attribute;

import com.f88.productfactory.domain.model.attribute.AttributeEnumValue;
import com.f88.productfactory.domain.model.attribute.AttributeEnumValueId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttributeEnumValueRepository extends JpaRepository<AttributeEnumValue, AttributeEnumValueId> {

    /** Danh sách giá trị enum của một attribute, đúng thứ tự sort_order. */
    List<AttributeEnumValue> findByAttributeCodeOrderBySortOrder(String attributeCode);
}
