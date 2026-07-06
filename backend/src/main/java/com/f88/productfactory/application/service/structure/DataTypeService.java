package com.f88.productfactory.application.service.structure;

import com.f88.productfactory.domain.model.structure.DataType;
import com.f88.productfactory.domain.repository.attribute.AttributeRepository;
import com.f88.productfactory.domain.repository.structure.DataTypeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Data Type (Layer II).
 *
 * KHÁC read-only thuần: tab "Data Type" của màn Attribute cần thêm SỐ ATTRIBUTE
 * (đếm attribute dùng data type này) — dữ liệu đếm, nên list tự dựng Page<Map>.
 */
@Service
public class DataTypeService {

    private final DataTypeRepository repo;
    private final AttributeRepository attributeRepo;

    public DataTypeService(DataTypeRepository repo, AttributeRepository attributeRepo) {
        this.repo = repo;
        this.attributeRepo = attributeRepo;
    }

    /** Danh sách Data Type (làm giàu): { code, name, attributeCount }. */
    public Page<Map<String, Object>> list(Pageable pageable) {
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
    public Optional<DataType> byId(String code) {
        return repo.findById(code);
    }
}
