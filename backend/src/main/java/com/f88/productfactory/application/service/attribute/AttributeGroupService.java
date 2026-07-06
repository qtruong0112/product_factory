package com.f88.productfactory.application.service.attribute;

import com.f88.productfactory.domain.model.attribute.AttributeGroup;
import com.f88.productfactory.domain.model.attribute.Domain;
import com.f88.productfactory.domain.repository.attribute.AttributeGroupRepository;
import com.f88.productfactory.domain.repository.attribute.AttributeRepository;
import com.f88.productfactory.domain.repository.attribute.DomainRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Attribute Group (Layer II).
 *
 * KHÁC read-only thuần: tab "Attribute Group" của màn Attribute cần thêm DOMAIN (tên,
 * join domain_code) và SỐ ATTRIBUTE (đếm attribute thuộc group) — dữ liệu join/đếm,
 * nên list tự dựng Page<Map>.
 */
@Service
public class AttributeGroupService {

    private final AttributeGroupRepository repo;
    private final AttributeRepository attributeRepo;
    private final DomainRepository domainRepo;

    public AttributeGroupService(AttributeGroupRepository repo,
                                 AttributeRepository attributeRepo,
                                 DomainRepository domainRepo) {
        this.repo = repo;
        this.attributeRepo = attributeRepo;
        this.domainRepo = domainRepo;
    }

    /** Danh sách Attribute Group (làm giàu): { code, name, domainCode, domainName, attributeCount }. */
    public Page<Map<String, Object>> list(Pageable pageable) {
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
    public Optional<AttributeGroup> byId(String code) {
        return repo.findById(code);
    }
}
