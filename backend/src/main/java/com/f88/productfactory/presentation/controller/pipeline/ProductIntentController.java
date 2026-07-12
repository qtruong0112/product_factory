package com.f88.productfactory.presentation.controller.pipeline;

import com.f88.productfactory.application.service.pipeline.ProductIntentService;
import com.f88.productfactory.domain.model.pipeline.ProductIntent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Product Intent — list() làm giàu (coreCount/auxCount, Giai đoạn 66) nên không còn extends
 * ReadOnlyController thuần (xem ProductIntentService).
 */
@RestController
@RequestMapping("/api/product-intents")
public class ProductIntentController {

    private final ProductIntentService service;

    public ProductIntentController(ProductIntentService service) {
        this.service = service;
    }

    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
        return service.list(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductIntent> byId(@PathVariable Long id) {
        return service.byId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable Long id) {
        return service.detail(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
