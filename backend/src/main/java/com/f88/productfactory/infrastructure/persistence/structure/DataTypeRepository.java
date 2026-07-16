package com.f88.productfactory.infrastructure.persistence.structure;

import com.f88.productfactory.domain.model.structure.DataType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DataTypeRepository extends JpaRepository<DataType, String> {
}
