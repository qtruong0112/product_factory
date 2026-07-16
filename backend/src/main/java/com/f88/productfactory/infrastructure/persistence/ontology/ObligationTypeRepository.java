package com.f88.productfactory.infrastructure.persistence.ontology;

import com.f88.productfactory.domain.model.ontology.ObligationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ObligationTypeRepository extends JpaRepository<ObligationType, String> {

    /** Obligation Type thuộc một Archetype — cho bảng "typeRows" ở màn Archetype detail. */
    List<ObligationType> findByArchetypeCode(String archetypeCode);

    /** Đếm Obligation Type thuộc một Archetype — cho card Archetype. */
    long countByArchetypeCode(String archetypeCode);
}
