package com.f88.productfactory.attribute;

import com.f88.productfactory.common.ReadOnlyController;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attributes")
public class AttributeController extends ReadOnlyController<Attribute, String> {

    private final AttributeRepository repo;

    public AttributeController(AttributeRepository repo) {
        this.repo = repo;
    }

    @Override
    protected JpaRepository<Attribute, String> repository() {
        return repo;
    }
}
