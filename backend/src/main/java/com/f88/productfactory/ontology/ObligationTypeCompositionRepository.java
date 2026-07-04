package com.f88.productfactory.ontology;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ObligationTypeCompositionRepository extends JpaRepository<ObligationTypeComposition, ObligationTypeCompositionId> {

    /** Đếm số dòng composition (element đã chọn cho mỗi Element Type) của một Obligation Type. */
    long countByObligationTypeCode(String obligationTypeCode);
}
