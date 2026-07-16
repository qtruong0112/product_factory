package com.f88.productfactory.presentation.controller.ontology;

import com.f88.productfactory.domain.model.ontology.LifecycleState;
import com.f88.productfactory.domain.model.ontology.LifecycleStateId;
import com.f88.productfactory.infrastructure.persistence.ontology.LifecycleStateRepository;
import com.f88.productfactory.presentation.common.ReadOnlyController;
import com.f88.productfactory.application.common.ReadOnlyService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lifecycle-states")
public class LifecycleStateController extends ReadOnlyController<LifecycleState, LifecycleStateId> {

    private final LifecycleStateRepository repo;

    public LifecycleStateController(LifecycleStateRepository repo) { this.repo = repo; }

    @Override
    protected ReadOnlyService<LifecycleState, LifecycleStateId> service() { return new ReadOnlyService<>(repo); }
}
