package com.f88.productfactory.presentation.controller.attribute;

import com.f88.productfactory.application.service.attribute.AttributeGroupService;
import com.f88.productfactory.domain.model.attribute.AttributeGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/attribute-groups")
public class AttributeGroupController {

    private final AttributeGroupService service;

    public AttributeGroupController(AttributeGroupService service) {
        this.service = service;
    }

    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
        return service.list(pageable);
    }

    @GetMapping("/{code}")
    public ResponseEntity<AttributeGroup> byId(@PathVariable String code) {
        return service.byId(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
