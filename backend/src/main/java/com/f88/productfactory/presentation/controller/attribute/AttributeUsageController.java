package com.f88.productfactory.presentation.controller.attribute;

import com.f88.productfactory.application.service.attribute.AttributeUsageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/attributes")
public class AttributeUsageController {

    private final AttributeUsageService service;

    public AttributeUsageController(AttributeUsageService service) {
        this.service = service;
    }

    /** Lineage Attribute → Answer Slot → Template/Config → Variant (màn Attribute Usage). */
    @GetMapping("/{code}/usage")
    public ResponseEntity<Map<String, Object>> usage(@PathVariable String code) {
        return service.usage(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
