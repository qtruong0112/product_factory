package com.f88.productfactory.domain.repository.attribute;

import com.f88.productfactory.domain.model.attribute.Attribute;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttributeRepository extends JpaRepository<Attribute, String> {

    /** Đếm attribute thuộc một group — cho cột "SỐ ATTRIBUTE" ở tab Attribute Group. */
    long countByGroupCode(String groupCode);

    /** Đếm attribute dùng một data type — cho cột "SỐ ATTRIBUTE" ở tab Data Type. */
    long countByDataTypeCode(String dataTypeCode);
}
