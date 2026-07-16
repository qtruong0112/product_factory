package com.f88.productfactory.infrastructure.persistence.ontology;

import com.f88.productfactory.domain.model.ontology.ObligationTypeComposition;
import com.f88.productfactory.domain.model.ontology.ObligationTypeCompositionId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ObligationTypeCompositionRepository extends JpaRepository<ObligationTypeComposition, ObligationTypeCompositionId> {

    /** Đếm số dòng composition (element đã chọn cho mỗi OET) của một Obligation Type. */
    long countByObligationTypeCode(String obligationTypeCode);

    /** Toàn bộ dòng composition của 1 OTF — cho màn detail (nhóm theo ot_core_code+leg ở service). */
    List<ObligationTypeComposition> findByObligationTypeCode(String obligationTypeCode);
}
