package com.f88.productfactory.infrastructure.persistence.ontology;

import com.f88.productfactory.domain.model.ontology.FinancialObligationArchetype;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialObligationArchetypeRepository extends JpaRepository<FinancialObligationArchetype, String> {
}
