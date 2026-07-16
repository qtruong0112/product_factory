package com.f88.productfactory.infrastructure.persistence.ontology;

import com.f88.productfactory.domain.model.ontology.ObligationElementType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ObligationElementTypeRepository extends JpaRepository<ObligationElementType, String> {
}
