package com.f88.productfactory.ontology;

import com.f88.productfactory.common.ReadOnlyController;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/obligation-elements")
public class ObligationElementController extends ReadOnlyController<ObligationElement, String> {

    private final ObligationElementRepository repo;

    public ObligationElementController(ObligationElementRepository repo) { this.repo = repo; }

    @Override
    protected JpaRepository<ObligationElement, String> repository() { return repo; }
}
