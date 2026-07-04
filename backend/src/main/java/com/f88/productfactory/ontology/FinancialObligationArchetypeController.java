package com.f88.productfactory.ontology;

import com.f88.productfactory.common.ReadOnlyController;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/archetypes")
public class FinancialObligationArchetypeController extends ReadOnlyController<FinancialObligationArchetype, String> {

    private final FinancialObligationArchetypeRepository repo;

    public FinancialObligationArchetypeController(FinancialObligationArchetypeRepository repo) { this.repo = repo; }

    @Override
    protected JpaRepository<FinancialObligationArchetype, String> repository() { return repo; }
}
