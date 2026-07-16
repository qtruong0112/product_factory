package com.f88.productfactory.infrastructure.persistence.ontology;

import com.f88.productfactory.domain.model.ontology.Lifecycle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LifecycleRepository extends JpaRepository<Lifecycle, String> {
}
