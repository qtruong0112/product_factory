package com.f88.productfactory.presentation.controller.ontology;

import com.f88.productfactory.application.service.ontology.FinancialObligationArchetypeService;
import com.f88.productfactory.domain.model.ontology.FinancialObligationArchetype;
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
@RequestMapping("/api/archetypes")
public class FinancialObligationArchetypeController {

    private final FinancialObligationArchetypeService service;

    public FinancialObligationArchetypeController(FinancialObligationArchetypeService service) {
        this.service = service;
    }

    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
        return service.list(pageable);
    }

    @GetMapping("/{code}")
    public ResponseEntity<FinancialObligationArchetype> byId(@PathVariable String code) {
        return service.byId(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{code}/detail")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable String code) {
        return service.detail(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
