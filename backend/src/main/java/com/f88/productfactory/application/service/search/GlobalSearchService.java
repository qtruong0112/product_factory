package com.f88.productfactory.application.service.search;

import com.f88.productfactory.domain.model.attribute.Attribute;
import com.f88.productfactory.domain.model.attribute.Domain;
import com.f88.productfactory.domain.model.ontology.FinancialObligationArchetype;
import com.f88.productfactory.domain.model.ontology.Lifecycle;
import com.f88.productfactory.domain.model.ontology.ObligationType;
import com.f88.productfactory.domain.model.pipeline.BusinessIntent;
import com.f88.productfactory.domain.model.pipeline.ProductConfig;
import com.f88.productfactory.domain.model.pipeline.ProductIntent;
import com.f88.productfactory.domain.model.pipeline.ProductPattern;
import com.f88.productfactory.domain.model.pipeline.ProductTemplate;
import com.f88.productfactory.domain.model.pipeline.ProductVariant;
import com.f88.productfactory.domain.model.structure.Block;
import com.f88.productfactory.domain.repository.attribute.AttributeRepository;
import com.f88.productfactory.domain.repository.attribute.DomainRepository;
import com.f88.productfactory.domain.repository.ontology.FinancialObligationArchetypeRepository;
import com.f88.productfactory.domain.repository.ontology.LifecycleRepository;
import com.f88.productfactory.domain.repository.ontology.ObligationTypeRepository;
import com.f88.productfactory.domain.repository.pipeline.BusinessIntentRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductConfigRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductIntentRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductPatternRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductTemplateRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductVariantRepository;
import com.f88.productfactory.domain.repository.structure.BlockRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Tìm kiếm toàn hệ thống (thanh tìm kiếm ở topbar — trước đây là input trang trí, không gắn logic).
 *
 * Quét trực tiếp qua các bảng lõi (đều nhỏ, seed data), so khớp chuỗi con không phân biệt hoa
 * thường trên tên + mã thật (không bịa, không dùng index/full-text riêng). Mỗi loại giới hạn
 * {@link #PER_TYPE_LIMIT} kết quả để tránh 1 loại át hết danh sách. `path` trỏ thẳng tới route
 * chi tiết đã có sẵn của từng màn — Obligation Type (chưa có detail riêng) trỏ qua Archetype cha
 * (`archetype_code`, cột NOT NULL) vì đó là màn chi tiết thật gần nhất chứa thông tin obligation type.
 */
@Service
public class GlobalSearchService {

    private static final int PER_TYPE_LIMIT = 5;

    private final BusinessIntentRepository businessIntentRepo;
    private final ProductIntentRepository productIntentRepo;
    private final ProductPatternRepository patternRepo;
    private final ProductTemplateRepository templateRepo;
    private final ProductConfigRepository configRepo;
    private final ProductVariantRepository variantRepo;
    private final ObligationTypeRepository obligationTypeRepo;
    private final FinancialObligationArchetypeRepository archetypeRepo;
    private final BlockRepository blockRepo;
    private final AttributeRepository attributeRepo;
    private final DomainRepository domainRepo;
    private final LifecycleRepository lifecycleRepo;

    public GlobalSearchService(BusinessIntentRepository businessIntentRepo,
                                ProductIntentRepository productIntentRepo,
                                ProductPatternRepository patternRepo,
                                ProductTemplateRepository templateRepo,
                                ProductConfigRepository configRepo,
                                ProductVariantRepository variantRepo,
                                ObligationTypeRepository obligationTypeRepo,
                                FinancialObligationArchetypeRepository archetypeRepo,
                                BlockRepository blockRepo,
                                AttributeRepository attributeRepo,
                                DomainRepository domainRepo,
                                LifecycleRepository lifecycleRepo) {
        this.businessIntentRepo = businessIntentRepo;
        this.productIntentRepo = productIntentRepo;
        this.patternRepo = patternRepo;
        this.templateRepo = templateRepo;
        this.configRepo = configRepo;
        this.variantRepo = variantRepo;
        this.obligationTypeRepo = obligationTypeRepo;
        this.archetypeRepo = archetypeRepo;
        this.blockRepo = blockRepo;
        this.attributeRepo = attributeRepo;
        this.domainRepo = domainRepo;
        this.lifecycleRepo = lifecycleRepo;
    }

    /** Kết quả: [{ type, code, name, status, path }], gộp từ nhiều loại thực thể, mỗi loại tối đa 5. */
    public List<Map<String, Object>> search(String q) {
        if (q == null) return List.of();
        String needle = q.trim().toLowerCase();
        if (needle.length() < 2) return List.of();

        List<Map<String, Object>> out = new ArrayList<>();

        addMatches(out, needle, "Business Intent", businessIntentRepo.findAll(),
                BusinessIntent::getName, bi -> null, BusinessIntent::getStatus,
                bi -> "/businessintent/" + bi.getId());

        addMatches(out, needle, "Product Intent", productIntentRepo.findAll(),
                ProductIntent::getName, ProductIntent::getCode, ProductIntent::getStatus,
                pi -> "/intent/" + pi.getId());

        addMatches(out, needle, "Product Pattern", patternRepo.findAll(),
                ProductPattern::getName, ProductPattern::getCode, ProductPattern::getStatus,
                p -> "/pattern/" + p.getCode());

        addMatches(out, needle, "Product Template", templateRepo.findAll(),
                ProductTemplate::getName, ProductTemplate::getCode, ProductTemplate::getStatus,
                t -> "/template/" + t.getCode());

        addMatches(out, needle, "Product Config", configRepo.findAll(),
                ProductConfig::getName, ProductConfig::getCode, ProductConfig::getStatus,
                c -> "/config/" + c.getCode());

        addMatches(out, needle, "Product Variant", variantRepo.findAll(),
                ProductVariant::getName, ProductVariant::getCode, ProductVariant::getStatus,
                v -> "/variant/" + v.getCode());

        addMatches(out, needle, "Obligation Type", obligationTypeRepo.findAll(),
                ObligationType::getName, ObligationType::getCode, ObligationType::getStatus,
                ot -> "/archetype/" + ot.getArchetypeCode());

        addMatches(out, needle, "Financial Obligation Archetype", archetypeRepo.findAll(),
                FinancialObligationArchetype::getName, FinancialObligationArchetype::getCode, a -> null,
                a -> "/archetype/" + a.getCode());

        addMatches(out, needle, "Block", blockRepo.findAll(),
                Block::getName, Block::getCode, Block::getStatus,
                b -> "/block/" + b.getId());

        addMatches(out, needle, "Attribute", attributeRepo.findAll(),
                Attribute::getName, Attribute::getCode, a -> null,
                a -> "/attribute/" + a.getCode());

        addMatches(out, needle, "Domain", domainRepo.findAll(),
                Domain::getName, Domain::getCode, Domain::getStatus,
                d -> "/domain/" + d.getCode());

        addMatches(out, needle, "Lifecycle", lifecycleRepo.findAll(),
                Lifecycle::getName, Lifecycle::getCode, Lifecycle::getStatus,
                l -> "/lifecycle/" + l.getCode());

        return out;
    }

    private <T> void addMatches(List<Map<String, Object>> out, String needle, String typeLabel, List<T> all,
                                 Function<T, String> nameFn, Function<T, String> codeFn,
                                 Function<T, String> statusFn, Function<T, String> pathFn) {
        int count = 0;
        for (T item : all) {
            if (count >= PER_TYPE_LIMIT) break;
            String name = nameFn.apply(item);
            String code = codeFn.apply(item);
            boolean match = (name != null && name.toLowerCase().contains(needle))
                    || (code != null && code.toLowerCase().contains(needle));
            if (!match) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("type", typeLabel);
            m.put("code", code);
            m.put("name", name);
            m.put("status", statusFn.apply(item));
            m.put("path", pathFn.apply(item));
            out.add(m);
            count++;
        }
    }
}
