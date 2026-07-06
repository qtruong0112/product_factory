package com.f88.productfactory.presentation.controller.pipeline;

import com.f88.productfactory.domain.model.pipeline.BusinessIntent;
import com.f88.productfactory.domain.model.pipeline.BusinessIntentKpi;
import com.f88.productfactory.domain.repository.pipeline.BusinessIntentKpiRepository;
import com.f88.productfactory.domain.repository.pipeline.BusinessIntentRepository;
import com.f88.productfactory.presentation.common.ReadOnlyController;
import com.f88.productfactory.application.common.ReadOnlyService;
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
 * Business Intent (Lớp III — Pipeline). List thuần qua {@link ReadOnlyController}.
 * `/{id}/detail` (NEXT_WORK mục 5.1) bổ sung KPI thật từ `business_intent_kpi` — không có
 * màn chi tiết nào trong prototype (row click chỉ mở modal "Tạo Business Intent" chung), nên
 * đây là màn XEM mới dựng theo quyết định nợ đã chốt, dùng dữ liệu DB thật 100%.
 */
@RestController
@RequestMapping("/api/business-intents")
public class BusinessIntentController extends ReadOnlyController<BusinessIntent, Long> {

    private final BusinessIntentRepository repo;
    private final BusinessIntentKpiRepository kpiRepo;

    public BusinessIntentController(BusinessIntentRepository repo, BusinessIntentKpiRepository kpiRepo) {
        this.repo = repo;
        this.kpiRepo = kpiRepo;
    }

    @Override
    protected ReadOnlyService<BusinessIntent, Long> service() { return new ReadOnlyService<>(repo); }

    /** Chi tiết: { intent, kpis:[{sortOrder,metric,target,unit}] } — [] nếu BI chưa khai báo KPI. */
    @GetMapping("/{id}/detail")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable Long id) {
        return repo.findById(id).map(bi -> {
            List<Map<String, Object>> kpis = new ArrayList<>();
            for (BusinessIntentKpi k : kpiRepo.findByBusinessIntentIdOrderBySortOrder(id)) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("sortOrder", k.getSortOrder());
                m.put("metric", k.getMetric());
                m.put("target", k.getTarget());
                m.put("unit", k.getUnit());
                kpis.add(m);
            }
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("intent", bi);
            body.put("kpis", kpis);
            return ResponseEntity.ok(body);
        }).orElse(ResponseEntity.notFound().build());
    }
}
