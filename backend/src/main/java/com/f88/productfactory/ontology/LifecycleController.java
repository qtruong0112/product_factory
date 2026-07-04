package com.f88.productfactory.ontology;

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
 * Lifecycle (Layer I — ontology).
 *
 * KHÁC read-only thuần: màn "lifecycle" cần thêm SỐ STATE (đếm lifecycle_state
 * theo lifecycle_code) — dữ liệu đếm, nên list tự dựng Page<Map>.
 */
@RestController
@RequestMapping("/api/lifecycles")
public class LifecycleController {

    private final LifecycleRepository repo;
    private final LifecycleStateRepository stateRepo;

    public LifecycleController(LifecycleRepository repo, LifecycleStateRepository stateRepo) {
        this.repo = repo;
        this.stateRepo = stateRepo;
    }

    /** Danh sách Lifecycle (làm giàu): { code, name, governs, status, stateCount }. */
    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
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
    @GetMapping("/{code}")
    public ResponseEntity<Lifecycle> byId(@PathVariable String code) {
        return repo.findById(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
