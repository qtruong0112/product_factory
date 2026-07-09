package com.f88.productfactory.presentation.controller.governance;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
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

    /** Tab "FOA × Obligation Element" — Giai đoạn 51, PHÁI SINH TỪ foa_element (nguồn duy nhất). */
    @GetMapping("/foa-oe-matrix")
    public Map<String, Object> foaOeMatrix() {
        return service.foaOeMatrix();
    }

    /** Tab "Obligation Element × Block" — Giai đoạn 58, PHÁI SINH TỪ block.governed_by_element_code. */
    @GetMapping("/oe-block-matrix")
    public Map<String, Object> oeBlockMatrix() {
        return service.oeBlockMatrix();
    }
}
