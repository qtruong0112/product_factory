package com.f88.productfactory.ontology;

import com.f88.productfactory.common.ReadOnlyController;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/foa-elements")
public class FoaElementController extends ReadOnlyController<FoaElement, FoaElementId> {

    private final FoaElementRepository repo;

    public FoaElementController(FoaElementRepository repo) { this.repo = repo; }

    @Override
    protected JpaRepository<FoaElement, FoaElementId> repository() { return repo; }
}
