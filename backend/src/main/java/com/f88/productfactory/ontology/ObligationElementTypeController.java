package com.f88.productfactory.ontology;

import com.f88.productfactory.common.ReadOnlyController;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/obligation-element-types")
public class ObligationElementTypeController extends ReadOnlyController<ObligationElementType, String> {

    private final ObligationElementTypeRepository repo;

    public ObligationElementTypeController(ObligationElementTypeRepository repo) { this.repo = repo; }

    @Override
    protected JpaRepository<ObligationElementType, String> repository() { return repo; }
}
