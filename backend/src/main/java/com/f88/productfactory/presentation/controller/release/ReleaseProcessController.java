package com.f88.productfactory.presentation.controller.release;

import com.f88.productfactory.application.service.release.ReleaseProcessService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/release-processes")
public class ReleaseProcessController {

    private final ReleaseProcessService service;

    public ReleaseProcessController(ReleaseProcessService service) {
        this.service = service;
    }

    /** Quy trình phát hành của một Product Variant — tiến độ tính runtime từ variant.status. */
    @GetMapping("/{variantCode}/detail")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable String variantCode) {
        return service.detailByVariant(variantCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
