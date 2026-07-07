package com.f88.productfactory.application.service.ontology;

import com.f88.productfactory.domain.model.ontology.Lifecycle;
import com.f88.productfactory.domain.model.ontology.LifecycleState;
import com.f88.productfactory.domain.repository.ontology.LifecycleRepository;
import com.f88.productfactory.domain.repository.ontology.LifecycleStateRepository;
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
 * Lifecycle (Layer I — ontology).
 *
 * KHÁC read-only thuần: màn "lifecycle" cần thêm SỐ STATE (đếm lifecycle_state
 * theo lifecycle_code) — dữ liệu đếm, nên list tự dựng Page<Map>.
 */
@Service
public class LifecycleService {

    private final LifecycleRepository repo;
    private final LifecycleStateRepository stateRepo;

    public LifecycleService(LifecycleRepository repo, LifecycleStateRepository stateRepo) {
        this.repo = repo;
        this.stateRepo = stateRepo;
    }

    /** Danh sách Lifecycle (làm giàu): { code, name, governs, status, stateCount }. */
    public Page<Map<String, Object>> list(Pageable pageable) {
        Page<Lifecycle> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Lifecycle l : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", l.getCode());
            row.put("name", l.getName());
            row.put("governs", l.getGoverns());
            row.put("status", l.getStatus());
            row.put("stateCount", stateRepo.countByLifecycleCode(l.getCode()));
            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /** Chi tiết entity theo PK (code). */
    public Optional<Lifecycle> byId(String code) {
        return repo.findById(code);
    }

    /** Chi tiết Lifecycle làm giàu: entity + danh sách state theo đúng thứ tự (cho stepper). */
    public Optional<Map<String, Object>> detail(String code) {
        return repo.findById(code).map(l -> {
            List<LifecycleState> states = stateRepo.findByLifecycleCodeOrderBySortOrder(code);
            List<Map<String, Object>> stateRows = new ArrayList<>();
            for (LifecycleState s : states) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("sortOrder", s.getSortOrder());
                row.put("name", s.getName());
                stateRows.add(row);
            }
            Map<String, Object> result = new LinkedHashMap<>();
            Map<String, Object> lifecycle = new LinkedHashMap<>();
            lifecycle.put("code", l.getCode());
            lifecycle.put("name", l.getName());
            lifecycle.put("governs", l.getGoverns());
            lifecycle.put("status", l.getStatus());
            result.put("lifecycle", lifecycle);
            result.put("states", stateRows);
            result.put("stateCount", stateRows.size());
            return result;
        });
    }
}
