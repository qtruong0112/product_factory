package com.f88.productfactory.ontology;

import com.f88.productfactory.common.ReadOnlyController;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/obligation-types")
public class ObligationTypeController extends ReadOnlyController<ObligationType, String> {

    private final ObligationTypeRepository repo;

    public ObligationTypeController(ObligationTypeRepository repo) { this.repo = repo; }

    @Override
    protected JpaRepository<ObligationType, String> repository() { return repo; }
}
