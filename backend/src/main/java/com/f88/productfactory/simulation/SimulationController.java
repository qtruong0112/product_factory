package com.f88.productfactory.simulation;

import com.f88.productfactory.attribute.AttributeConstraint;
import com.f88.productfactory.attribute.AttributeConstraintRepository;
import com.f88.productfactory.pipeline.CustomerSegment;
import com.f88.productfactory.pipeline.CustomerSegmentRepository;
import com.f88.productfactory.pipeline.Fragment;
import com.f88.productfactory.pipeline.FragmentRepository;
import com.f88.productfactory.pipeline.ProductConfig;
import com.f88.productfactory.pipeline.ProductConfigRepository;
import com.f88.productfactory.pipeline.ProductTemplate;
import com.f88.productfactory.pipeline.ProductTemplateRepository;
import com.f88.productfactory.pipeline.ProductVariant;
import com.f88.productfactory.pipeline.ProductVariantRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Simulation Engine (Lớp IV — phần 10% có TÍNH TOÁN thật, theo CLAUDE.md/PROJECT_STATUS mục 2.2).
 *
 * `GET /variants` liệt kê thật mọi Product Variant (cho dropdown "Sản phẩm (Variant)" — trước đây
 * cố định 1 sản phẩm, Giai đoạn 24 cho chọn bất kỳ). `GET /default?variantCode=` suy ra tham số
 * khởi tạo cho variant được chọn: parse thật `limit_range`/`display_rate` của variant và fragment
 * `ltv`/`installment_count` của config gốc (không bịa) — riêng phí thẩm định/quản lý/ân hạn không
 * có nguồn per-product trong DB nên dùng hằng số khởi tạo chung (người dùng tự chỉnh tiếp).
 * `POST /run` KHÔNG ghi DB — tính bằng {@link SimulationEngine} (cổng Java của `simData()` bundler).
 */
@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

    private static final Pattern MONEY_TOKEN = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(tr|tỷ)", Pattern.CASE_INSENSITIVE);
    private static final Pattern RATE_TOKEN = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*%");
    private static final Pattern INT_RANGE_TOKEN = Pattern.compile("(\\d+)");

    private final SimulationScenarioRepository scenarioRepo;
    private final SimulationScheduleRowRepository scheduleRepo;
    private final CustomerSegmentRepository segmentRepo;
    private final ProductVariantRepository variantRepo;
    private final ProductConfigRepository configRepo;
    private final ProductTemplateRepository templateRepo;
    private final FragmentRepository fragmentRepo;
    private final AttributeConstraintRepository constraintRepo;

    public SimulationController(SimulationScenarioRepository scenarioRepo,
                                SimulationScheduleRowRepository scheduleRepo,
                                CustomerSegmentRepository segmentRepo,
                                ProductVariantRepository variantRepo,
                                ProductConfigRepository configRepo,
                                ProductTemplateRepository templateRepo,
                                FragmentRepository fragmentRepo,
                                AttributeConstraintRepository constraintRepo) {
        this.scenarioRepo = scenarioRepo;
        this.scheduleRepo = scheduleRepo;
        this.segmentRepo = segmentRepo;
        this.variantRepo = variantRepo;
        this.configRepo = configRepo;
        this.templateRepo = templateRepo;
        this.fragmentRepo = fragmentRepo;
        this.constraintRepo = constraintRepo;
    }

    /** Trần "regulatory" thật của 1 attribute (vd base_rate/ltv/penalty_rate) từ attribute_constraint. */
    private BigDecimal regulatoryCap(String attributeCode) {
        return constraintRepo.findByAttributeCode(attributeCode).stream()
                .filter(c -> "regulatory".equals(c.getKind()) && c.getMaxValue() != null)
                .map(AttributeConstraint::getMaxValue)
                .findFirst().orElse(null);
    }

    /** Danh sách Product Variant thật cho dropdown "Sản phẩm (Variant)". */
    @GetMapping("/variants")
    public List<Map<String, Object>> variants() {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ProductVariant v : variantRepo.findAll()) {
            String templateName = null;
            Optional<ProductConfig> cfg = configRepo.findById(v.getFromConfigCode());
            if (cfg.isPresent()) {
                Optional<ProductTemplate> tpl = templateRepo.findById(cfg.get().getFromTemplateCode());
                templateName = tpl.map(ProductTemplate::getName).orElse(null);
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", v.getCode());
            row.put("name", v.getName());
            row.put("status", v.getStatus());
            row.put("fromConfigCode", v.getFromConfigCode());
            row.put("templateName", templateName);
            row.put("limitRange", v.getLimitRange());
            row.put("displayRate", v.getDisplayRate());
            rows.add(row);
        }
        rows.sort(Comparator.comparing(r -> (String) r.get("code")));
        return rows;
    }

    /** Kịch bản khởi tạo cho 1 variant — { scenario, schedule } (schedule tính runtime bằng engine). */
    @GetMapping("/default")
    public ResponseEntity<Map<String, Object>> getDefault(@RequestParam(required = false) String variantCode) {
        List<SimulationScenario> all = scenarioRepo.findAll();
        if (all.isEmpty()) return ResponseEntity.notFound().build();
        SimulationScenario seeded = all.get(0);

        Map<String, Object> scenarioMap;
        if (variantCode == null || variantCode.equals(seeded.getVariantCode())) {
            scenarioMap = fromSeeded(seeded);
        } else {
            Optional<ProductVariant> v = variantRepo.findById(variantCode);
            if (v.isEmpty()) return ResponseEntity.notFound().build();
            scenarioMap = deriveFromVariant(v.get());
        }

        SimulationRequest req = toRequest(scenarioMap);
        applyRegulatoryCaps(req);
        String tier = tierOf((String) scenarioMap.get("segmentCode"));
        Map<String, Object> engineResult = SimulationEngine.run(req, tier);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("scenario", scenarioMap);
        body.put("result", engineResult);
        return ResponseEntity.ok(body);
    }

    /** Chạy mô phỏng cho tham số bất kỳ — KHÔNG ghi DB, chỉ tính runtime. */
    @PostMapping("/run")
    public Map<String, Object> run(@RequestBody SimulationRequest req) {
        applyRegulatoryCaps(req);
        String tier = tierOf(req.getSegmentCode());
        return SimulationEngine.run(req, tier);
    }

    /** Gắn trần LTV/lãi suất/hệ số phạt THẬT từ attribute_constraint vào request trước khi tính. */
    private void applyRegulatoryCaps(SimulationRequest req) {
        req.setLtvCapPct(regulatoryCap("ltv"));
        req.setRateCapPct(regulatoryCap("base_rate"));
        req.setPenaltyFactor(regulatoryCap("penalty_rate"));
    }

    private String tierOf(String segmentCode) {
        if (segmentCode == null) return null;
        return segmentRepo.findById(segmentCode).map(CustomerSegment::getTier).orElse(null);
    }

    private Map<String, Object> fromSeeded(SimulationScenario s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("variantCode", s.getVariantCode());
        m.put("configCode", s.getConfigCode());
        m.put("amount", s.getAmount());
        m.put("amountMin", new BigDecimal("3000000"));
        m.put("amountMax", new BigDecimal("50000000"));
        m.put("months", s.getMonths());
        m.put("monthsMin", 3);
        m.put("monthsMax", 36);
        m.put("termLimit", 18);
        m.put("baseRatePct", s.getBaseRatePct());
        m.put("assetValue", s.getAssetValue());
        m.put("segmentCode", s.getSegmentCode());
        m.put("startDate", s.getStartDate());
        m.put("appraisalFee", s.getAppraisalFee());
        m.put("periodicFeePct", s.getPeriodicFeePct());
        // Kịch bản demo gốc (bundler state.sim) bật sẵn cả 3 tình huống để minh họa đầy đủ engine —
        // khớp đúng ảnh chụp prototype (kỳ 6 trễ 10 ngày, kỳ 9 trả thêm 8tr, 2 kỳ ân hạn).
        m.put("penaltyOn", true); m.put("penaltyPeriod", 6); m.put("penaltyDays", 10);
        m.put("prepayOn", true); m.put("prepayPeriod", 9); m.put("prepayAmount", new BigDecimal("8000000"));
        m.put("graceOn", true); m.put("graceMonths", 2);
        m.put("earlyOn", false); m.put("earlyPeriod", 12); m.put("earlyPenaltyPct", new BigDecimal("2"));
        return m;
    }

    /**
     * Suy tham số khởi tạo từ dữ liệu thật của variant: parse `limit_range`/`display_rate` (variant)
     * và fragment `ltv`/`installment_count` (config gốc) — amount/months lấy trung điểm khoảng thật,
     * assetValue suy từ amount/LTV. Phí thẩm định/quản lý/ân hạn không có nguồn per-product nên dùng
     * hằng số khởi tạo chung (giống mọi variant khác) — người dùng tự chỉnh tiếp trên form.
     */
    private Map<String, Object> deriveFromVariant(ProductVariant v) {
        List<Fragment> frags = fragmentRepo.findByConfigCode(v.getFromConfigCode());
        String ltvDefault = fragmentDefault(frags, "ltv");
        String installDefault = fragmentDefault(frags, "installment_count");
        String limitDefault = fragmentDefault(frags, "limit_amount");

        long[] amountRange = parseMoneyRange(v.getLimitRange());
        if (amountRange == null) amountRange = parseMoneyRange(limitDefault);
        if (amountRange == null) amountRange = new long[] { 3_000_000, 50_000_000 };
        long amountMin = amountRange[0], amountMax = amountRange[1];
        long amount = Math.round((amountMin + amountMax) / 2.0 / 1_000_000.0) * 1_000_000;
        amount = Math.max(amountMin, Math.min(amountMax, amount));

        int[] monthsRange = parseIntRange(installDefault);
        if (monthsRange == null) monthsRange = new int[] { 3, 18 };
        int monthsMin = monthsRange[0], monthsMax = Math.max(monthsRange[1], monthsRange[0] + 1);
        int months = Math.round((monthsMin + monthsMax) / 2f);

        BigDecimal rate = parseRate(v.getDisplayRate());
        if (rate == null) rate = parseRate(fragmentDefault(frags, "base_rate"));
        if (rate == null) rate = new BigDecimal("1.5");

        BigDecimal ltv = parseRate(ltvDefault);
        BigDecimal assetValue;
        if (ltv != null && ltv.signum() > 0) {
            assetValue = BigDecimal.valueOf(amount).divide(ltv, 6, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
        } else {
            assetValue = BigDecimal.valueOf(amount).divide(new BigDecimal("0.8"), 0, RoundingMode.HALF_UP);
        }
        assetValue = assetValue.setScale(0, RoundingMode.HALF_UP);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("variantCode", v.getCode());
        m.put("configCode", v.getFromConfigCode());
        m.put("amount", BigDecimal.valueOf(amount));
        m.put("amountMin", BigDecimal.valueOf(amountMin));
        m.put("amountMax", BigDecimal.valueOf(amountMax));
        m.put("months", months);
        m.put("monthsMin", monthsMin);
        m.put("monthsMax", monthsMax);
        m.put("termLimit", monthsMax);
        m.put("baseRatePct", rate);
        m.put("assetValue", assetValue);
        m.put("segmentCode", "SEG_STANDARD");
        m.put("startDate", LocalDate.now().plusDays(30).toString());
        m.put("appraisalFee", new BigDecimal("500000"));
        m.put("periodicFeePct", new BigDecimal("0.15"));
        // Tình huống penalty/prepay/grace/early để mặc định TẮT cho variant khác VAR-101 (không như
        // kịch bản demo gốc) — kỳ hạn thực tế mỗi sản phẩm khác nhau (vd VAR-106 chỉ 7 kỳ) nên không
        // có giá trị "kỳ trễ/kỳ trả thêm" mặc định nào hợp lý chung cho mọi sản phẩm; người dùng tự bật.
        m.put("penaltyOn", false); m.put("penaltyPeriod", Math.max(1, months / 3)); m.put("penaltyDays", 10);
        m.put("prepayOn", false); m.put("prepayPeriod", Math.max(1, months / 2)); m.put("prepayAmount", new BigDecimal("5000000"));
        m.put("graceOn", false); m.put("graceMonths", 1);
        m.put("earlyOn", false); m.put("earlyPeriod", Math.max(1, months - 1)); m.put("earlyPenaltyPct", new BigDecimal("2"));
        return m;
    }

    private static String fragmentDefault(List<Fragment> frags, String slotCode) {
        return frags.stream()
                .filter(f -> slotCode.equals(f.getSlotCode()) && "default".equals(f.getScopeCode()))
                .map(Fragment::getValue)
                .findFirst().orElse(null);
    }

    /** "3tr – 50tr" / "50tr – 2 tỷ" → [3000000, 50000000] (tr=triệu, tỷ=tỷ đồng). */
    private static long[] parseMoneyRange(String text) {
        if (text == null) return null;
        Matcher m = MONEY_TOKEN.matcher(text);
        List<Long> values = new ArrayList<>();
        while (m.find()) {
            double num = Double.parseDouble(m.group(1).replace(',', '.'));
            long unit = m.group(2).equalsIgnoreCase("tỷ") ? 1_000_000_000L : 1_000_000L;
            values.add(Math.round(num * unit));
        }
        if (values.isEmpty()) return null;
        if (values.size() == 1) return new long[] { values.get(0), values.get(0) };
        return new long[] { values.get(0), values.get(values.size() - 1) };
    }

    /** "1 – 18" → [1, 18]. */
    private static int[] parseIntRange(String text) {
        if (text == null) return null;
        Matcher m = INT_RANGE_TOKEN.matcher(text);
        List<Integer> values = new ArrayList<>();
        while (m.find()) values.add(Integer.parseInt(m.group(1)));
        if (values.isEmpty()) return null;
        if (values.size() == 1) return new int[] { values.get(0), values.get(0) };
        return new int[] { values.get(0), values.get(values.size() - 1) };
    }

    /** "1,5%/tháng" / "80%" → BigDecimal(1.5) / BigDecimal(80). */
    private static BigDecimal parseRate(String text) {
        if (text == null) return null;
        Matcher m = RATE_TOKEN.matcher(text);
        if (!m.find()) return null;
        return new BigDecimal(m.group(1).replace(',', '.'));
    }

    @SuppressWarnings("unchecked")
    private static SimulationRequest toRequest(Map<String, Object> s) {
        SimulationRequest req = new SimulationRequest();
        req.setVariantCode((String) s.get("variantCode"));
        req.setConfigCode((String) s.get("configCode"));
        req.setAmount(toBigDecimal(s.get("amount")));
        req.setMonths(((Number) s.get("months")).intValue());
        req.setBaseRatePct(toBigDecimal(s.get("baseRatePct")));
        req.setAssetValue(toBigDecimal(s.get("assetValue")));
        req.setSegmentCode((String) s.get("segmentCode"));
        Object sd = s.get("startDate");
        req.setStartDate(sd != null ? LocalDate.parse(sd.toString()) : null);
        req.setAppraisalFee(toBigDecimal(s.get("appraisalFee")));
        req.setPeriodicFeePct(toBigDecimal(s.get("periodicFeePct")));
        Object gm = s.get("graceMonths");
        req.setGraceMonths(gm != null ? ((Number) gm).intValue() : 0);
        req.setAmountMin(toBigDecimal(s.get("amountMin")));
        req.setAmountMax(toBigDecimal(s.get("amountMax")));
        Object tl = s.get("termLimit");
        req.setTermLimit(tl != null ? ((Number) tl).intValue() : null);
        req.setGraceOn(Boolean.TRUE.equals(s.get("graceOn")));
        req.setPenaltyOn(Boolean.TRUE.equals(s.get("penaltyOn")));
        req.setPenaltyPeriod(intOrNull(s.get("penaltyPeriod")));
        req.setPenaltyDays(intOrNull(s.get("penaltyDays")));
        req.setPrepayOn(Boolean.TRUE.equals(s.get("prepayOn")));
        req.setPrepayPeriod(intOrNull(s.get("prepayPeriod")));
        req.setPrepayAmount(toBigDecimal(s.get("prepayAmount")));
        req.setEarlyOn(Boolean.TRUE.equals(s.get("earlyOn")));
        req.setEarlyPeriod(intOrNull(s.get("earlyPeriod")));
        req.setEarlyPenaltyPct(toBigDecimal(s.get("earlyPenaltyPct")));
        return req;
    }

    private static Integer intOrNull(Object o) {
        return o != null ? ((Number) o).intValue() : null;
    }

    private static BigDecimal toBigDecimal(Object o) {
        if (o == null) return null;
        if (o instanceof BigDecimal bd) return bd;
        if (o instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return new BigDecimal(o.toString());
    }
}
