package com.f88.productfactory.presentation.controller.simulation;

import com.f88.productfactory.application.dto.simulation.SimulationRequest;
import com.f88.productfactory.application.service.simulation.SimulationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Simulation Engine (Lớp IV — phần 10% có TÍNH TOÁN thật, theo CLAUDE.md/PROJECT_STATUS mục 2.2).
 * Toàn bộ logic (suy tham số từ variant, gắn trần quy định, chạy engine) nằm ở
 * {@link SimulationService} — controller chỉ ánh xạ HTTP.
 */
@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

    private final SimulationService service;

    public SimulationController(SimulationService service) {
        this.service = service;
    }

    /** Danh sách Product Variant thật cho dropdown "Sản phẩm (Variant)". */
    @GetMapping("/variants")
    public List<Map<String, Object>> variants() {
        return service.variants();
    }

    /** Kịch bản khởi tạo cho 1 variant — { scenario, result } (result tính runtime bằng engine). */
    @GetMapping("/default")
    public ResponseEntity<Map<String, Object>> getDefault(@RequestParam(required = false) String variantCode) {
        return service.getDefault(variantCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Chạy mô phỏng cho tham số bất kỳ — KHÔNG ghi DB, chỉ tính runtime. */
    @PostMapping("/run")
    public Map<String, Object> run(@RequestBody SimulationRequest req) {
        return service.run(req);
    }
}
