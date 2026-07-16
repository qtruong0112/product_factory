package com.f88.productfactory.presentation.controller.ontology;

import com.f88.productfactory.domain.model.ontology.OtActivationRule;
import com.f88.productfactory.domain.model.ontology.OtActivationRuleId;
import com.f88.productfactory.infrastructure.persistence.ontology.OtActivationRuleRepository;
import com.f88.productfactory.presentation.common.ReadOnlyController;
import com.f88.productfactory.application.common.ReadOnlyService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ot-activation-rules")
public class OtActivationRuleController extends ReadOnlyController<OtActivationRule, OtActivationRuleId> {

    private final OtActivationRuleRepository repo;

    public OtActivationRuleController(OtActivationRuleRepository repo) { this.repo = repo; }

    @Override
    protected ReadOnlyService<OtActivationRule, OtActivationRuleId> service() { return new ReadOnlyService<>(repo); }
}
