package com.f88.productfactory.presentation.controller.structure;

import com.f88.productfactory.application.service.structure.DataTypeService;
import com.f88.productfactory.domain.model.structure.DataType;
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
@RequestMapping("/api/data-types")
public class DataTypeController {

    private final DataTypeService service;

    public DataTypeController(DataTypeService service) {
        this.service = service;
    }

    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
        return service.list(pageable);
    }

    @GetMapping("/{code}")
    public ResponseEntity<DataType> byId(@PathVariable String code) {
        return service.byId(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
