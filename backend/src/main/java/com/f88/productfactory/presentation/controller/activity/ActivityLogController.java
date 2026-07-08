package com.f88.productfactory.presentation.controller.activity;

import com.f88.productfactory.application.service.activity.ActivityLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activity-logs")
public class ActivityLogController {

    private final ActivityLogService service;

    public ActivityLogController(ActivityLogService service) {
        this.service = service;
    }

    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 50) Pageable pageable) {
        return service.list(pageable);
    }

    /** Giai đoạn 42 — khối "Lịch sử duyệt" theo từng sản phẩm (Config/Pattern/Template/Variant...). */
    @GetMapping("/entity")
    public List<Map<String, Object>> forEntity(@RequestParam String type, @RequestParam String code) {
        return service.forEntity(type, code);
    }

    /** Giai đoạn 45 — màn chi tiết 1 dòng Nhật ký hoạt động. */
    @GetMapping("/{id}/detail")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable Long id) {
        return service.detail(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
