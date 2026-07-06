package com.f88.productfactory.presentation.controller.attribute;

import com.f88.productfactory.domain.model.attribute.Domain;
import com.f88.productfactory.domain.repository.attribute.DomainRepository;
import com.f88.productfactory.presentation.common.ReadOnlyController;
import com.f88.productfactory.application.common.ReadOnlyService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Domain (Layer II) — read-only thuần: mọi cột hiển thị (kể cả entityCount) đều là
 * cột thật trong bảng domain, không cần join/đếm gì thêm.
 */
@RestController
@RequestMapping("/api/domains")
public class DomainController extends ReadOnlyController<Domain, String> {

    private final DomainRepository repo;

    public DomainController(DomainRepository repo) { this.repo = repo; }

    @Override
    protected ReadOnlyService<Domain, String> service() { return new ReadOnlyService<>(repo); }
}
