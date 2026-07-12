package com.f88.productfactory.application.service.attribute;

import com.f88.productfactory.domain.model.attribute.Attribute;
import com.f88.productfactory.domain.model.attribute.AttributeConstraint;
import com.f88.productfactory.domain.model.structure.AnswerSlot;
import com.f88.productfactory.domain.model.structure.DataType;
import com.f88.productfactory.domain.repository.attribute.AttributeConstraintRepository;
import com.f88.productfactory.domain.repository.attribute.AttributeRepository;
import com.f88.productfactory.domain.repository.structure.AnswerSlotRepository;
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
import java.util.stream.Collectors;

/**
 * Attribute — từ điển thuộc tính dùng chung (Layer II).
 *
 * KHÁC read-only thuần: màn danh sách (tab Attribute) cần thêm DATA TYPE (tên),
 * DÙNG TRONG ANSWER SLOT (join answer_slot.attribute_code) và RÀNG BUỘC
 * (join attribute_constraint) — dữ liệu join/đếm, nên list tự dựng Page<Map>.
 *
 * Giữ các field phẳng cũ (code,name,groupCode,dataTypeCode,required,unit) để
 * route generic /attributes (tables.ts/DataTable) không bị vỡ.
 */
@Service
public class AttributeService {

    private final AttributeRepository repo;
    private final DataTypeRepository dataTypeRepo;
    private final AnswerSlotRepository slotRepo;
    private final AttributeConstraintRepository constraintRepo;

    public AttributeService(AttributeRepository repo,
                            DataTypeRepository dataTypeRepo,
                            AnswerSlotRepository slotRepo,
                            AttributeConstraintRepository constraintRepo) {
        this.repo = repo;
        this.dataTypeRepo = dataTypeRepo;
        this.slotRepo = slotRepo;
        this.constraintRepo = constraintRepo;
    }

    /**
     * Danh sách Attribute (làm giàu):
     * { code, name, groupCode, dataTypeCode, required, unit,
     *   dataTypeName, usedInSlots, constraintCount, constraintSummary }.
     */
    public Page<Map<String, Object>> list(Pageable pageable) {
        Page<Attribute> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Attribute a : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", a.getCode());
            row.put("name", a.getName());
            row.put("groupCode", a.getGroupCode());
            row.put("dataTypeCode", a.getDataTypeCode());
            row.put("required", a.isRequired());
            row.put("overridable", a.isOverridable());
            row.put("templateCustomizable", a.isTemplateCustomizable());
            row.put("defaultValue", a.getDefaultValue());
            row.put("unit", a.getUnit());

            String dataTypeName = dataTypeRepo.findById(a.getDataTypeCode())
                    .map(DataType::getName)
                    .orElse(a.getDataTypeCode());
            row.put("dataTypeName", dataTypeName);

            List<String> usedInSlots = slotRepo.findByAttributeCode(a.getCode()).stream()
                    .map(AnswerSlot::getName)
                    .collect(Collectors.toList());
            row.put("usedInSlots", usedInSlots);

            List<AttributeConstraint> constraints = constraintRepo.findByAttributeCode(a.getCode());
            row.put("constraintCount", constraints.size());
            String constraintSummary = null;
            if (!constraints.isEmpty()) {
                AttributeConstraint c = constraints.get(0);
                constraintSummary = c.getMessage() != null ? c.getMessage()
                        : c.getExpression() != null ? c.getExpression()
                        : c.getKind();
            }
            row.put("constraintSummary", constraintSummary);

            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /** Chi tiết entity theo PK (code). */
    public Optional<Attribute> byId(String code) {
        return repo.findById(code);
    }
}
