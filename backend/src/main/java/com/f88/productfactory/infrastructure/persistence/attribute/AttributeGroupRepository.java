package com.f88.productfactory.infrastructure.persistence.attribute;

import com.f88.productfactory.domain.model.attribute.AttributeGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttributeGroupRepository extends JpaRepository<AttributeGroup, String> {

    /** Danh sách Attribute Group thuộc một Domain — cho màn chi tiết Domain. */
    List<AttributeGroup> findByDomainCodeOrderByName(String domainCode);
}
