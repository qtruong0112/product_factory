package com.f88.productfactory.application.service.attribute;

import com.f88.productfactory.domain.model.attribute.Attribute;
import com.f88.productfactory.domain.model.attribute.AttributeConstraint;
import com.f88.productfactory.domain.model.attribute.AttributeEnumValue;
import com.f88.productfactory.domain.model.attribute.AttributeGroup;
import com.f88.productfactory.domain.model.attribute.Domain;
import com.f88.productfactory.domain.model.pipeline.Fragment;
import com.f88.productfactory.domain.model.pipeline.ProductConfig;
import com.f88.productfactory.domain.model.pipeline.ProductTemplate;
import com.f88.productfactory.domain.model.pipeline.TemplateFrame;
import com.f88.productfactory.domain.model.structure.AnswerSlot;
import com.f88.productfactory.domain.model.structure.Block;
import com.f88.productfactory.domain.repository.attribute.AttributeConstraintRepository;
import com.f88.productfactory.domain.repository.attribute.AttributeEnumValueRepository;
import com.f88.productfactory.domain.repository.attribute.AttributeGroupRepository;
import com.f88.productfactory.domain.repository.attribute.AttributeRepository;
import com.f88.productfactory.domain.repository.attribute.DomainRepository;
import com.f88.productfactory.domain.repository.pipeline.FragmentRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductConfigRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductTemplateRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductVariantRepository;
import com.f88.productfactory.domain.repository.pipeline.TemplateFrameRepository;
import com.f88.productfactory.domain.repository.structure.AnswerSlotRepository;
import com.f88.productfactory.domain.repository.structure.BlockRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Attribute Usage — lineage Attribute → Answer Slot → Template/Config → Variant (nợ 5.4,
 * Giai đoạn 29). Không có FK trực tiếp attribute→fragment/template_frame; phải bắc cầu qua
 * answer_slot (block_id, slot_code). Toàn bộ dữ liệu join từ bảng thật, không suy diễn.
 */
@Service
public class AttributeUsageService {

    private final AttributeRepository attributeRepo;
    private final AttributeGroupRepository groupRepo;
    private final DomainRepository domainRepo;
    private final AttributeConstraintRepository constraintRepo;
    private final AttributeEnumValueRepository enumValueRepo;
    private final AnswerSlotRepository slotRepo;
    private final TemplateFrameRepository templateFrameRepo;
    private final FragmentRepository fragmentRepo;
    private final ProductTemplateRepository templateRepo;
    private final ProductConfigRepository configRepo;
    private final ProductVariantRepository variantRepo;
    private final BlockRepository blockRepo;

    public AttributeUsageService(AttributeRepository attributeRepo,
                                  AttributeGroupRepository groupRepo,
                                  DomainRepository domainRepo,
                                  AttributeConstraintRepository constraintRepo,
                                  AttributeEnumValueRepository enumValueRepo,
                                  AnswerSlotRepository slotRepo,
                                  TemplateFrameRepository templateFrameRepo,
                                  FragmentRepository fragmentRepo,
                                  ProductTemplateRepository templateRepo,
                                  ProductConfigRepository configRepo,
                                  ProductVariantRepository variantRepo,
                                  BlockRepository blockRepo) {
        this.attributeRepo = attributeRepo;
        this.groupRepo = groupRepo;
        this.domainRepo = domainRepo;
        this.constraintRepo = constraintRepo;
        this.enumValueRepo = enumValueRepo;
        this.slotRepo = slotRepo;
        this.templateFrameRepo = templateFrameRepo;
        this.fragmentRepo = fragmentRepo;
        this.templateRepo = templateRepo;
        this.configRepo = configRepo;
        this.variantRepo = variantRepo;
        this.blockRepo = blockRepo;
    }

    public Optional<Map<String, Object>> usage(String code) {
        Optional<Attribute> attrOpt = attributeRepo.findById(code);
        if (attrOpt.isEmpty()) {
            return Optional.empty();
        }
        Attribute attribute = attrOpt.get();

        Map<String, Object> attrInfo = new LinkedHashMap<>();
        attrInfo.put("code", attribute.getCode());
        attrInfo.put("name", attribute.getName());
        attrInfo.put("dataTypeCode", attribute.getDataTypeCode());
        attrInfo.put("required", attribute.isRequired());
        attrInfo.put("unique", attribute.isUnique());
        attrInfo.put("nullable", attribute.isNullable());
        attrInfo.put("overridable", attribute.isOverridable());
        attrInfo.put("templateCustomizable", attribute.isTemplateCustomizable());
        attrInfo.put("defaultValue", attribute.getDefaultValue());
        attrInfo.put("unit", attribute.getUnit());
        attrInfo.put("groupCode", attribute.getGroupCode());
        Optional<AttributeGroup> group = groupRepo.findById(attribute.getGroupCode());
        attrInfo.put("groupName", group.map(AttributeGroup::getName).orElse(attribute.getGroupCode()));
        String domainCode = group.map(AttributeGroup::getDomainCode).orElse(null);
        attrInfo.put("domainCode", domainCode);
        attrInfo.put("domainName", domainCode == null ? null
                : domainRepo.findById(domainCode).map(Domain::getName).orElse(domainCode));

        List<Map<String, Object>> constraints = constraintRepo.findByAttributeCode(code).stream()
                .map(this::constraintRow)
                .collect(Collectors.toList());

        List<Map<String, Object>> enumValues = new ArrayList<>();
        for (AttributeEnumValue ev : enumValueRepo.findByAttributeCodeOrderBySortOrder(code)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("value", ev.getValue());
            enumValues.add(row);
        }

        Set<String> configCodesUsed = new LinkedHashSet<>();
        List<Map<String, Object>> slots = new ArrayList<>();
        for (AnswerSlot slot : slotRepo.findByAttributeCode(code)) {
            Map<String, Object> slotRow = new LinkedHashMap<>();
            slotRow.put("blockId", slot.getBlockId());
            slotRow.put("blockName", blockRepo.findById(slot.getBlockId()).map(Block::getName).orElse(slot.getBlockId()));
            slotRow.put("slotCode", slot.getCode());
            slotRow.put("slotName", slot.getName());

            List<Map<String, Object>> usedInTemplates = new ArrayList<>();
            for (TemplateFrame frame : templateFrameRepo.findByBlockIdAndSlotCode(slot.getBlockId(), slot.getCode())) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("templateCode", frame.getTemplateCode());
                row.put("templateName", templateRepo.findById(frame.getTemplateCode())
                        .map(ProductTemplate::getName).orElse(frame.getTemplateCode()));
                row.put("frameValue", frame.getFrameValue());
                usedInTemplates.add(row);
            }
            slotRow.put("usedInTemplates", usedInTemplates);

            List<Map<String, Object>> usedInFragments = new ArrayList<>();
            for (Fragment fragment : fragmentRepo.findByBlockIdAndSlotCode(slot.getBlockId(), slot.getCode())) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("configCode", fragment.getConfigCode());
                row.put("configName", configRepo.findById(fragment.getConfigCode())
                        .map(ProductConfig::getName).orElse(fragment.getConfigCode()));
                row.put("scopeCode", fragment.getScopeCode());
                row.put("scopeValue", fragment.getScopeValue());
                row.put("value", fragment.getValue());
                row.put("isWarning", fragment.isWarning());
                usedInFragments.add(row);
                configCodesUsed.add(fragment.getConfigCode());
            }
            slotRow.put("usedInFragments", usedInFragments);

            slots.add(slotRow);
        }

        List<Map<String, Object>> usedInVariants = variantRepo.findByFromConfigCodeIn(new ArrayList<>(configCodesUsed))
                .stream()
                .map(v -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("code", v.getCode());
                    row.put("name", v.getName());
                    row.put("fromConfigCode", v.getFromConfigCode());
                    row.put("status", v.getStatus());
                    return (Map<String, Object>) row;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("attribute", attrInfo);
        result.put("constraints", constraints);
        result.put("enumValues", enumValues);
        result.put("slots", slots);
        result.put("usedInVariants", usedInVariants);
        return Optional.of(result);
    }

    private Map<String, Object> constraintRow(AttributeConstraint c) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("kind", c.getKind());
        row.put("minValue", c.getMinValue());
        row.put("maxValue", c.getMaxValue());
        row.put("stepValue", c.getStepValue());
        row.put("expression", c.getExpression());
        row.put("dependsOnAttributeCode", c.getDependsOnAttributeCode());
        row.put("message", c.getMessage());
        return row;
    }
}
