package com.f88.productfactory.ontology;

import com.f88.productfactory.common.ReadOnlyController;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/obligation-type-compositions")
public class ObligationTypeCompositionController extends ReadOnlyController<ObligationTypeComposition, ObligationTypeCompositionId> {

    private final ObligationTypeCompositionRepository repo;

    public ObligationTypeCompositionController(ObligationTypeCompositionRepository repo) { this.repo = repo; }

    @Override
    protected JpaRepository<ObligationTypeComposition, ObligationTypeCompositionId> repository() { return repo; }
}
