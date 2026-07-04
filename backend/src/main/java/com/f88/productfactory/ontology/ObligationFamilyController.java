package com.f88.productfactory.ontology;

import com.f88.productfactory.common.ReadOnlyController;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/obligation-families")
public class ObligationFamilyController extends ReadOnlyController<ObligationFamily, String> {

    private final ObligationFamilyRepository repo;

    public ObligationFamilyController(ObligationFamilyRepository repo) { this.repo = repo; }

    @Override
    protected JpaRepository<ObligationFamily, String> repository() { return repo; }
}
