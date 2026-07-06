package com.f88.productfactory.presentation.controller.pipeline;

import com.f88.productfactory.domain.model.pipeline.ProductIntent;
import com.f88.productfactory.domain.model.pipeline.ProductIntentElement;
import com.f88.productfactory.domain.repository.pipeline.BusinessIntentRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductIntentElementRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductIntentRepository;
import com.f88.productfactory.presentation.common.ReadOnlyController;
import com.f88.productfactory.domain.repository.ontology.FinancialObligationArchetypeRepository;
import com.f88.productfactory.application.common.ReadOnlyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/product-intents")
public class ProductIntentController extends ReadOnlyController<ProductIntent, Long> {

    private final ProductIntentRepository repo;
    private final ProductIntentElementRepository elementRepo;
    private final BusinessIntentRepository businessIntentRepo;
    private final FinancialObligationArchetypeRepository archetypeRepo;

    public ProductIntentController(ProductIntentRepository repo,
                                   ProductIntentElementRepository elementRepo,
                                   BusinessIntentRepository businessIntentRepo,
                                   FinancialObligationArchetypeRepository archetypeRepo) {
        this.repo = repo;
        this.elementRepo = elementRepo;
        this.businessIntentRepo = businessIntentRepo;
        this.archetypeRepo = archetypeRepo;
    }

    @Override
    protected ReadOnlyService<ProductIntent, Long> service() { return new ReadOnlyService<>(repo); }

    /**
     * Chi tiết Product Intent: entity chính + tên BI cha + tên archetype + list element nền.
     * Trả Map để kèm dữ liệu tra cứu hiển thị mà không đổi entity read-only.
     */
    @GetMapping("/{id}/detail")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable Long id) {
        return repo.findById(id).map(intent -> {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("intent", intent);

            String biName = businessIntentRepo.findById(intent.getBusinessIntentId())
                    .map(bi -> bi.getName())
                    .orElse(null);
            body.put("businessIntentName", biName);

            String archetypeName = archetypeRepo.findById(intent.getArchetypeCode())
                    .map(a -> a.getName())
                    .orElse(null);
            body.put("archetypeName", archetypeName);

            List<String> elements = elementRepo
                    .findByProductIntentIdOrderByElementCode(id)
                    .stream()
                    .map(ProductIntentElement::getElementCode)
                    .toList();
            body.put("elements", elements);

            return ResponseEntity.ok(body);
        }).orElse(ResponseEntity.notFound().build());
    }
}
