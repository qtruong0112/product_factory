package com.f88.productfactory.presentation.controller.ontology;

import com.f88.productfactory.domain.model.ontology.ObligationTypeCore;
import com.f88.productfactory.infrastructure.persistence.ontology.ObligationTypeCoreRepository;
import com.f88.productfactory.presentation.common.ReadOnlyController;
import com.f88.productfactory.application.common.ReadOnlyService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/obligation-type-cores")
public class ObligationTypeCoreController extends ReadOnlyController<ObligationTypeCore, String> {

    private final ObligationTypeCoreRepository repo;

    public ObligationTypeCoreController(ObligationTypeCoreRepository repo) { this.repo = repo; }

    @Override
    protected ReadOnlyService<ObligationTypeCore, String> service() { return new ReadOnlyService<>(repo); }
}
