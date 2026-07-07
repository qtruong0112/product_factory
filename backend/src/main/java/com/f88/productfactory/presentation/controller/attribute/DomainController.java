package com.f88.productfactory.presentation.controller.attribute;

import com.f88.productfactory.application.service.attribute.DomainService;
import com.f88.productfactory.domain.model.attribute.Domain;
import com.f88.productfactory.domain.repository.attribute.DomainRepository;
import com.f88.productfactory.presentation.common.ReadOnlyController;
import com.f88.productfactory.application.common.ReadOnlyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Domain (Layer II) — list/byId read-only thuần: mọi cột hiển thị (kể cả entityCount) đều là
 * cột thật trong bảng domain. Riêng /detail làm giàu: join sang Attribute Group thuộc domain.
 */
@RestController
@RequestMapping("/api/domains")
public class DomainController extends ReadOnlyController<Domain, String> {

    private final DomainRepository repo;
    private final DomainService detailService;

    public DomainController(DomainRepository repo, DomainService detailService) {
        this.repo = repo;
        this.detailService = detailService;
    }

    @Override
    protected ReadOnlyService<Domain, String> service() { return new ReadOnlyService<>(repo); }

    @GetMapping("/{code}/detail")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable String code) {
        return detailService.detail(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
