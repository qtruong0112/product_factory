package com.f88.productfactory.presentation.controller.ontology;

import com.f88.productfactory.domain.model.ontology.ObligationTypeComposition;
import com.f88.productfactory.domain.model.ontology.ObligationTypeCompositionId;
import com.f88.productfactory.domain.repository.ontology.ObligationTypeCompositionRepository;
import com.f88.productfactory.presentation.common.ReadOnlyController;
import com.f88.productfactory.application.common.ReadOnlyService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/obligation-type-compositions")
public class ObligationTypeCompositionController extends ReadOnlyController<ObligationTypeComposition, ObligationTypeCompositionId> {

    private final ObligationTypeCompositionRepository repo;

    public ObligationTypeCompositionController(ObligationTypeCompositionRepository repo) { this.repo = repo; }

    @Override
    protected ReadOnlyService<ObligationTypeComposition, ObligationTypeCompositionId> service() { return new ReadOnlyService<>(repo); }
}
