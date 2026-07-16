package com.f88.productfactory.infrastructure.persistence.ontology;

import com.f88.productfactory.domain.model.ontology.FoaElement;
import com.f88.productfactory.domain.model.ontology.FoaElementId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FoaElementRepository extends JpaRepository<FoaElement, FoaElementId> {

    /** Element gắn với một Archetype (kèm requirement) — cho màn Archetype detail. */
    List<FoaElement> findByArchetypeCode(String archetypeCode);
}
