package com.f88.productfactory.pipeline;

import com.f88.productfactory.common.ReadOnlyController;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/business-intents")
public class BusinessIntentController extends ReadOnlyController<BusinessIntent, Long> {

    private final BusinessIntentRepository repo;

    public BusinessIntentController(BusinessIntentRepository repo) { this.repo = repo; }

    @Override
    protected JpaRepository<BusinessIntent, Long> repository() { return repo; }
}
