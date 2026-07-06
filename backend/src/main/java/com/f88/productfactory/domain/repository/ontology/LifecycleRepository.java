package com.f88.productfactory.domain.repository.ontology;

import com.f88.productfactory.domain.model.ontology.Lifecycle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LifecycleRepository extends JpaRepository<Lifecycle, String> {
}
