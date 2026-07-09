package com.f88.productfactory.presentation.controller.governance;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.f88.productfactory.application.service.governance.ConstraintMatrixService;

@RestController
@RequestMapping("/api/constraint-matrices")
public class ConstraintMatrixController {

    private final ConstraintMatrixService service;

    public ConstraintMatrixController(ConstraintMatrixService service) {
        this.service = service;
    }

    /** Danh sách ma trận (cho tab bar): [{id, kind, title, description}] theo id. */
    @GetMapping
    public List<Map<String, Object>> list() {
        return service.list();
    }

    /**
     * Grid đầy đủ của một ma trận:
     * { matrix:{id,kind,title,description}, rowHead, legend,
     *   cols:[{code,label}], rows:[{code,label,cells:[verdict...]}] }.
     */
    @GetMapping("/{id}/detail")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable Long id) {
        return service.detail(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Tab 4 "Pattern × Block (độ phủ)" — PHÁI SINH TỪ DB THẬT. */
    @GetMapping("/pattern-coverage")
    public Map<String, Object> patternCoverage() {
        return service.patternCoverage();
    }

    /** Tab "FOA × Obligation Element" — Giai đoạn 51, PHÁI SINH TỪ foa_element (nguồn duy nhất). */
    @GetMapping("/foa-oe-matrix")
    public Map<String, Object> foaOeMatrix() {
        return service.foaOeMatrix();
    }
}
