package com.f88.productfactory.attribute;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Attribute Group (Layer II).
 *
 * KHÁC read-only thuần: tab "Attribute Group" của màn Attribute cần thêm DOMAIN (tên,
 * join domain_code) và SỐ ATTRIBUTE (đếm attribute thuộc group) — dữ liệu join/đếm,
 * nên list tự dựng Page<Map>.
 */
@RestController
@RequestMapping("/api/attribute-groups")
public class AttributeGroupController {

    private final AttributeGroupRepository repo;
    private final AttributeRepository attributeRepo;
    private final DomainRepository domainRepo;

    public AttributeGroupController(AttributeGroupRepository repo,
                                    AttributeRepository attributeRepo,
                                    DomainRepository domainRepo) {
        this.repo = repo;
        this.attributeRepo = attributeRepo;
        this.domainRepo = domainRepo;
    }

    /** Danh sách Attribute Group (làm giàu): { code, name, domainCode, domainName, attributeCount }. */
    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
        Page<AttributeGroup> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (AttributeGroup g : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", g.getCode());
            row.put("name", g.getName());
            row.put("domainCode", g.getDomainCode());
            row.put("domainName", domainRepo.findById(g.getDomainCode())
                    .map(Domain::getName)
                    .orElse(g.getDomainCode()));
            row.put("attributeCount", attributeRepo.countByGroupCode(g.getCode()));
            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /** Chi tiết entity theo PK (code). */
    @GetMapping("/{code}")
    public ResponseEntity<AttributeGroup> byId(@PathVariable String code) {
        return repo.findById(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
