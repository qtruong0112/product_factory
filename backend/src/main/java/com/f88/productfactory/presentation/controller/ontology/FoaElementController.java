package com.f88.productfactory.presentation.controller.ontology;

import com.f88.productfactory.domain.model.ontology.FoaElement;
import com.f88.productfactory.domain.model.ontology.FoaElementId;
import com.f88.productfactory.domain.repository.ontology.FoaElementRepository;
import com.f88.productfactory.presentation.common.ReadOnlyController;
import com.f88.productfactory.application.common.ReadOnlyService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/foa-elements")
public class FoaElementController extends ReadOnlyController<FoaElement, FoaElementId> {

    private final FoaElementRepository repo;

    public FoaElementController(FoaElementRepository repo) { this.repo = repo; }

    @Override
    protected ReadOnlyService<FoaElement, FoaElementId> service() { return new ReadOnlyService<>(repo); }
}
