package com.f88.productfactory.ontology;

import com.f88.productfactory.common.ReadOnlyController;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lifecycles")
public class LifecycleController extends ReadOnlyController<Lifecycle, String> {

    private final LifecycleRepository repo;

    public LifecycleController(LifecycleRepository repo) { this.repo = repo; }

    @Override
    protected JpaRepository<Lifecycle, String> repository() { return repo; }
}
