package com.f88.productfactory.infrastructure.persistence.ontology;

import com.f88.productfactory.domain.model.ontology.OtActivationRule;
import com.f88.productfactory.domain.model.ontology.OtActivationRuleId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OtActivationRuleRepository extends JpaRepository<OtActivationRule, OtActivationRuleId> {
}
