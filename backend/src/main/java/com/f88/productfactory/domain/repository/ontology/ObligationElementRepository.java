package com.f88.productfactory.domain.repository.ontology;

import com.f88.productfactory.domain.model.ontology.ObligationElement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ObligationElementRepository extends JpaRepository<ObligationElement, String> {

    /** Đếm số Obligation Element thuộc một Element Type — cho cột "SỐ ELEMENT" ở tab Element Type. */
    long countByElementTypeCode(String elementTypeCode);
}
