package com.f88.productfactory.attribute;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttributeConstraintRepository extends JpaRepository<AttributeConstraint, Long> {

    /** Ràng buộc của một attribute — dùng cho cột "RÀNG BUỘC" ở màn danh sách. */
    List<AttributeConstraint> findByAttributeCode(String attributeCode);
}
