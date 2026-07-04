package com.f88.productfactory.ontology;

import com.f88.productfactory.common.ReadOnlyController;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lifecycle-states")
public class LifecycleStateController extends ReadOnlyController<LifecycleState, LifecycleStateId> {

    private final LifecycleStateRepository repo;

    public LifecycleStateController(LifecycleStateRepository repo) { this.repo = repo; }

    @Override
    protected JpaRepository<LifecycleState, LifecycleStateId> repository() { return repo; }
}
