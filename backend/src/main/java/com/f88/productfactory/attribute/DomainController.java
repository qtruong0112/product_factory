package com.f88.productfactory.attribute;

import com.f88.productfactory.common.ReadOnlyController;
import org.springframework.data.jpa.repository.JpaRepository;
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
    protected JpaRepository<Domain, String> repository() { return repo; }
}
