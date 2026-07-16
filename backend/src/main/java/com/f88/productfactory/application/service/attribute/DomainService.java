package com.f88.productfactory.application.service.attribute;

import com.f88.productfactory.domain.model.attribute.AttributeGroup;
import com.f88.productfactory.domain.model.attribute.Domain;
import com.f88.productfactory.infrastructure.persistence.attribute.AttributeGroupRepository;
import com.f88.productfactory.infrastructure.persistence.attribute.AttributeRepository;
import com.f88.productfactory.infrastructure.persistence.attribute.DomainRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Domain (Layer II) — chi tiết làm giàu cho màn chi tiết Domain (khác read-only thuần
 * dùng ở DomainController#list/byId): join sang Attribute Group thuộc domain (domain_code)
 * và đếm attribute trong từng group.
 */
@Service
public class DomainService {

    private final DomainRepository repo;
    private final AttributeGroupRepository groupRepo;
    private final AttributeRepository attributeRepo;

    public DomainService(DomainRepository repo, AttributeGroupRepository groupRepo, AttributeRepository attributeRepo) {
        this.repo = repo;
        this.groupRepo = groupRepo;
        this.attributeRepo = attributeRepo;
    }

    /** Chi tiết Domain làm giàu: entity + danh sách Attribute Group thuộc domain (kèm số attribute). */
    public Optional<Map<String, Object>> detail(String code) {
        return repo.findById(code).map(d -> {
            List<AttributeGroup> groups = groupRepo.findByDomainCodeOrderByName(code);
            List<Map<String, Object>> groupRows = new ArrayList<>();
            long totalAttributeCount = 0;
            for (AttributeGroup g : groups) {
                long attributeCount = attributeRepo.countByGroupCode(g.getCode());
                totalAttributeCount += attributeCount;
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("code", g.getCode());
                row.put("name", g.getName());
                row.put("attributeCount", attributeCount);
                groupRows.add(row);
            }
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("domain", toMap(d));
            result.put("groups", groupRows);
            result.put("groupCount", groupRows.size());
            result.put("totalAttributeCount", totalAttributeCount);
            return result;
        });
    }

    private Map<String, Object> toMap(Domain d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", d.getCode());
        m.put("name", d.getName());
        m.put("description", d.getDescription());
        m.put("entityCount", d.getEntityCount());
        m.put("status", d.getStatus());
        return m;
    }
}
