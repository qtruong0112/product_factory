package com.f88.productfactory.presentation.controller.ontology;

import com.f88.productfactory.domain.model.ontology.ObligationFamily;
import com.f88.productfactory.domain.repository.ontology.ObligationFamilyRepository;
import com.f88.productfactory.presentation.common.ReadOnlyController;
import com.f88.productfactory.application.common.ReadOnlyService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/obligation-families")
public class ObligationFamilyController extends ReadOnlyController<ObligationFamily, String> {

    private final ObligationFamilyRepository repo;

    public ObligationFamilyController(ObligationFamilyRepository repo) { this.repo = repo; }

    @Override
    protected ReadOnlyService<ObligationFamily, String> service() { return new ReadOnlyService<>(repo); }
}
