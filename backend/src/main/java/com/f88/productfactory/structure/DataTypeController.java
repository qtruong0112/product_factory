package com.f88.productfactory.structure;

import com.f88.productfactory.attribute.AttributeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Data Type (Layer II).
 *
 * KHÁC read-only thuần: tab "Data Type" của màn Attribute cần thêm SỐ ATTRIBUTE
 * (đếm attribute dùng data type này) — dữ liệu đếm, nên list tự dựng Page<Map>.
 */
@RestController
@RequestMapping("/api/data-types")
public class DataTypeController {

    private final DataTypeRepository repo;
    private final AttributeRepository attributeRepo;

    public DataTypeController(DataTypeRepository repo, AttributeRepository attributeRepo) {
        this.repo = repo;
        this.attributeRepo = attributeRepo;
    }

    /** Danh sách Data Type (làm giàu): { code, name, attributeCount }. */
    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
        Page<DataType> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (DataType dt : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", dt.getCode());
            row.put("name", dt.getName());
            row.put("attributeCount", attributeRepo.countByDataTypeCode(dt.getCode()));
            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /** Chi tiết entity theo PK (code). */
    @GetMapping("/{code}")
    public ResponseEntity<DataType> byId(@PathVariable String code) {
        return repo.findById(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
