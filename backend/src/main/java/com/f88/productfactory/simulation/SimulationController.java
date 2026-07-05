package com.f88.productfactory.simulation;

import com.f88.productfactory.pipeline.CustomerSegment;
import com.f88.productfactory.pipeline.CustomerSegmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Simulation Engine (Lớp IV — phần 10% có TÍNH TOÁN thật, theo CLAUDE.md/PROJECT_STATUS mục 2.2).
 *
 * `GET /default` đọc kịch bản mẫu thật (`simulation_scenario` id nhỏ nhất, pinned_label='A') +
 * lịch trả nợ (`simulation_schedule_row`) để nạp state ban đầu cho form — dữ liệu thật 100%.
 * `POST /run` KHÔNG ghi DB — nhận tham số tuỳ ý người dùng chỉnh (số tiền/kỳ hạn/lãi/ân hạn/
 * tình huống phạt-trả bớt-tất toán sớm), tính bằng {@link SimulationEngine} (cổng Java của
 * `simData()`/`annuity()` trong bundler prototype) và trả kết quả — không có "danh sách kịch
 * bản đã lưu" nào khác ngoài 1 kịch bản mặc định làm điểm khởi đầu.
 */
@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

    private final SimulationScenarioRepository scenarioRepo;
    private final SimulationScheduleRowRepository scheduleRepo;
    private final CustomerSegmentRepository segmentRepo;

    public SimulationController(SimulationScenarioRepository scenarioRepo,
                                SimulationScheduleRowRepository scheduleRepo,
                                CustomerSegmentRepository segmentRepo) {
        this.scenarioRepo = scenarioRepo;
        this.scheduleRepo = scheduleRepo;
        this.segmentRepo = segmentRepo;
    }

    /** Kịch bản mặc định thật (seed) để nạp form lúc mở màn: { scenario, schedule }. */
    @GetMapping("/default")
    public ResponseEntity<Map<String, Object>> getDefault() {
        List<SimulationScenario> all = scenarioRepo.findAll();
        if (all.isEmpty()) return ResponseEntity.notFound().build();
        SimulationScenario s = all.get(0);

        Map<String, Object> scenarioMap = new LinkedHashMap<>();
        scenarioMap.put("id", s.getId());
        scenarioMap.put("configCode", s.getConfigCode());
        scenarioMap.put("variantCode", s.getVariantCode());
        scenarioMap.put("amount", s.getAmount());
        scenarioMap.put("months", s.getMonths());
        scenarioMap.put("baseRatePct", s.getBaseRatePct());
        scenarioMap.put("assetValue", s.getAssetValue());
        scenarioMap.put("segmentCode", s.getSegmentCode());
        scenarioMap.put("startDate", s.getStartDate());
        scenarioMap.put("appraisalFee", s.getAppraisalFee());
        scenarioMap.put("periodicFeePct", s.getPeriodicFeePct());
        scenarioMap.put("graceMonths", s.getGraceMonths());
        scenarioMap.put("pinnedLabel", s.getPinnedLabel());

        List<Map<String, Object>> schedule = new ArrayList<>();
        for (SimulationScheduleRow row : scheduleRepo.findByScenarioIdOrderByPeriodNo(s.getId())) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("periodNo", row.getPeriodNo());
            r.put("dueDate", row.getDueDate());
            r.put("openingBalance", row.getOpeningBalance());
            r.put("principal", row.getPrincipal());
            r.put("interest", row.getInterest());
            r.put("fee", row.getFee());
            r.put("penalty", row.getPenalty());
            r.put("payment", row.getPayment());
            r.put("closingBalance", row.getClosingBalance());
            schedule.add(r);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("scenario", scenarioMap);
        body.put("schedule", schedule);
        return ResponseEntity.ok(body);
    }

    /** Chạy mô phỏng cho tham số bất kỳ — KHÔNG ghi DB, chỉ tính runtime. */
    @PostMapping("/run")
    public Map<String, Object> run(@RequestBody SimulationRequest req) {
        String tier = null;
        if (req.getSegmentCode() != null) {
            tier = segmentRepo.findById(req.getSegmentCode()).map(CustomerSegment::getTier).orElse(null);
        }
        return SimulationEngine.run(req, tier);
    }
}
