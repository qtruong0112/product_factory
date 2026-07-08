package com.f88.productfactory.application.service.simulation;

import com.f88.productfactory.application.dto.simulation.SimulationRequest;
import com.f88.productfactory.domain.model.attribute.AttributeConstraint;
import com.f88.productfactory.domain.model.pipeline.CustomerSegment;
import com.f88.productfactory.domain.model.pipeline.Fragment;
import com.f88.productfactory.domain.model.pipeline.ProductConfig;
import com.f88.productfactory.domain.model.pipeline.ProductTemplate;
import com.f88.productfactory.domain.model.pipeline.ProductVariant;
import com.f88.productfactory.domain.model.pipeline.TemplateFrame;
import com.f88.productfactory.domain.model.pipeline.TemplateSegment;
import com.f88.productfactory.domain.model.simulation.SimulationScenario;
import com.f88.productfactory.domain.model.structure.AnswerSlot;
import com.f88.productfactory.domain.repository.attribute.AttributeConstraintRepository;
import com.f88.productfactory.domain.repository.pipeline.CustomerSegmentRepository;
import com.f88.productfactory.domain.repository.pipeline.FragmentRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductConfigRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductTemplateRepository;
import com.f88.productfactory.domain.repository.pipeline.ProductVariantRepository;
import com.f88.productfactory.domain.repository.pipeline.TemplateFrameRepository;
import com.f88.productfactory.domain.repository.pipeline.TemplateSegmentRepository;
import com.f88.productfactory.domain.repository.simulation.SimulationScenarioRepository;
import com.f88.productfactory.domain.repository.structure.AnswerSlotRepository;
import org.springframework.stereotype.Service;

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
 * `variants()` liệt kê thật mọi Product Variant (cho dropdown "Sản phẩm (Variant)" — trước đây
 * cố định 1 sản phẩm, Giai đoạn 24 cho chọn bất kỳ). `getDefault(variantCode)` suy ra tham số
 * khởi tạo cho variant được chọn: parse thật `limit_range`/`display_rate` của variant và fragment
 * `ltv`/`installment_count` của config gốc (không bịa) — riêng phí thẩm định/quản lý/ân hạn không
 * có nguồn per-product trong DB nên dùng hằng số khởi tạo chung (người dùng tự chỉnh tiếp).
 * `run()` KHÔNG ghi DB — tính bằng {@link SimulationEngine} (cổng Java của `simData()` bundler).
 */
@Service
public class SimulationService {

    private static final Pattern MONEY_TOKEN = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(tr|tỷ)", Pattern.CASE_INSENSITIVE);
    private static final Pattern RATE_TOKEN = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*%");
    private static final Pattern INT_RANGE_TOKEN = Pattern.compile("(\\d+)");
    private static final Pattern VND_TOKEN = Pattern.compile("([0-9][0-9.,]*)\\s*đ", Pattern.CASE_INSENSITIVE);

    private final SimulationScenarioRepository scenarioRepo;
    private final CustomerSegmentRepository segmentRepo;
    private final ProductVariantRepository variantRepo;
    private final ProductConfigRepository configRepo;
    private final ProductTemplateRepository templateRepo;
    private final FragmentRepository fragmentRepo;
    private final AttributeConstraintRepository constraintRepo;
    private final TemplateFrameRepository templateFrameRepo;
    private final TemplateSegmentRepository templateSegmentRepo;
    private final AnswerSlotRepository answerSlotRepo;

    public SimulationService(SimulationScenarioRepository scenarioRepo,
                             CustomerSegmentRepository segmentRepo,
                             ProductVariantRepository variantRepo,
                             ProductConfigRepository configRepo,
                             ProductTemplateRepository templateRepo,
                             FragmentRepository fragmentRepo,
                             AttributeConstraintRepository constraintRepo,
                             TemplateFrameRepository templateFrameRepo,
                             TemplateSegmentRepository templateSegmentRepo,
                             AnswerSlotRepository answerSlotRepo) {
        this.scenarioRepo = scenarioRepo;
        this.segmentRepo = segmentRepo;
        this.variantRepo = variantRepo;
        this.configRepo = configRepo;
        this.templateRepo = templateRepo;
        this.fragmentRepo = fragmentRepo;
        this.constraintRepo = constraintRepo;
        this.templateFrameRepo = templateFrameRepo;
        this.templateSegmentRepo = templateSegmentRepo;
        this.answerSlotRepo = answerSlotRepo;
    }

    /** Trần "regulatory" thật của 1 attribute (vd base_rate/ltv/penalty_rate) từ attribute_constraint. */
    private BigDecimal regulatoryCap(String attributeCode) {
        return constraintRepo.findByAttributeCode(attributeCode).stream()
                .filter(c -> "regulatory".equals(c.getKind()) && c.getMaxValue() != null)
                .map(AttributeConstraint::getMaxValue)
                .findFirst().orElse(null);
    }

    /** Danh sách Product Variant thật cho dropdown "Sản phẩm (Variant)". */
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

    /** Kịch bản khởi tạo cho 1 variant — { scenario, result } (result tính runtime bằng engine). */
    public Optional<Map<String, Object>> getDefault(String variantCode) {
        List<SimulationScenario> all = scenarioRepo.findAll();
        if (all.isEmpty()) return Optional.empty();
        SimulationScenario seeded = all.get(0);

        Map<String, Object> scenarioMap;
        if (variantCode == null || variantCode.equals(seeded.getVariantCode())) {
            scenarioMap = fromSeeded(seeded);
        } else {
            Optional<ProductVariant> v = variantRepo.findById(variantCode);
            if (v.isEmpty()) return Optional.empty();
            scenarioMap = deriveFromVariant(v.get());
        }

        SimulationRequest req = toRequest(scenarioMap);
        applyRegulatoryCaps(req);
        String tier = tierOf((String) scenarioMap.get("segmentCode"));
        Map<String, Object> engineResult = SimulationEngine.run(req, tier);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("scenario", scenarioMap);
        body.put("result", engineResult);
        return Optional.of(body);
    }

    /** Chạy mô phỏng cho tham số bất kỳ — KHÔNG ghi DB, chỉ tính runtime. */
    public Map<String, Object> run(SimulationRequest req) {
        applyRegulatoryCaps(req);
        String tier = tierOf(req.getSegmentCode());
        return SimulationEngine.run(req, tier);
    }

    /**
     * Gắn trần LTV/lãi suất THẬT từ attribute_constraint, và chính sách phạt trễ hạn THẬT của
     * sản phẩm (`penaltyFactor`/`graceDays`, resolve theo configCode: fragment ghi đè → template
     * default → answer_slot default) vào request trước khi tính. Nếu request không kèm configCode
     * (gọi /run trực tiếp không qua sản phẩm nào) thì fallback về trần quy định như trước.
     */
    private void applyRegulatoryCaps(SimulationRequest req) {
        req.setLtvCapPct(regulatoryCap("ltv"));
        req.setRateCapPct(regulatoryCap("base_rate"));

        String configCode = req.getConfigCode();
        String templateCode = configCode != null
                ? configRepo.findById(configCode).map(ProductConfig::getFromTemplateCode).orElse(null)
                : null;

        BigDecimal penaltyRate = configCode != null
                ? parseRate(resolveSlotValue(configCode, templateCode, "BLK_PENALTY", "penalty_rate"))
                : null;
        req.setPenaltyFactor(penaltyRate != null ? penaltyRate : regulatoryCap("penalty_rate"));

        Integer graceDays = configCode != null
                ? parseFirstInt(resolveSlotValue(configCode, templateCode, "BLK_PENALTY", "grace"))
                : null;
        req.setGraceDays(graceDays != null ? graceDays : 0);
    }

    /**
     * Giá trị THẬT của 1 Answer Slot theo đúng thứ tự resolve của luồng Pattern→Template→Config
     * (khớp logic Giai đoạn 46): fragment ghi đè (scope "default") của Config → giá trị khung
     * (`template_frame`) của Template → default riêng của Answer Slot. Trả `null` nếu không tầng
     * nào có giá trị.
     */
    private String resolveSlotValue(String configCode, String templateCode, String blockId, String slotCode) {
        Optional<String> fragValue = fragmentRepo.findByConfigCode(configCode).stream()
                .filter(f -> blockId.equals(f.getBlockId()) && slotCode.equals(f.getSlotCode())
                        && "default".equals(f.getScopeCode()))
                .map(Fragment::getValue)
                .findFirst();
        if (fragValue.isPresent()) return fragValue.get();

        if (templateCode != null) {
            Optional<String> frameValue = templateFrameRepo.findByTemplateCode(templateCode).stream()
                    .filter(f -> blockId.equals(f.getBlockId()) && slotCode.equals(f.getSlotCode()))
                    .map(TemplateFrame::getFrameValue)
                    .findFirst();
            if (frameValue.isPresent()) return frameValue.get();
        }

        return answerSlotRepo.findByBlockId(blockId).stream()
                .filter(s -> slotCode.equals(s.getCode()))
                .map(AnswerSlot::getDefaultValue)
                .findFirst().orElse(null);
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
     * assetValue suy từ amount/LTV. `appraisalFee` (fee_amount) và `segmentCode` (template_segment)
     * cũng resolve THẬT theo Config/Template nguồn (Giai đoạn 47) — chỉ `periodicFeePct`/`startDate`
     * là không có nguồn per-product nào trong DB nên dùng hằng số khởi tạo chung, người dùng tự
     * chỉnh tiếp trên form.
     */
    private Map<String, Object> deriveFromVariant(ProductVariant v) {
        String configCode = v.getFromConfigCode();
        String templateCode = configRepo.findById(configCode).map(ProductConfig::getFromTemplateCode).orElse(null);

        List<Fragment> frags = fragmentRepo.findByConfigCode(configCode);
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

        // Phí thẩm định THẬT theo sản phẩm: fragment ghi đè → template_frame default → answer_slot
        // default (slot fee_amount, BLK_FEE) — fallback 500.000đ CHỈ khi không tầng nào có giá trị.
        Long feeAmount = parseVndAmount(resolveSlotValue(configCode, templateCode, "BLK_FEE", "fee_amount"));
        BigDecimal appraisalFee = feeAmount != null ? BigDecimal.valueOf(feeAmount) : new BigDecimal("500000");

        // Phân khúc THẬT theo Template nguồn (template_segment) — fallback SEG_STANDARD nếu Template
        // không có mapping nào (phòng thủ, không có nghĩa mọi sản phẩm đều chuẩn).
        String segmentCode = templateCode != null
                ? templateSegmentRepo.findByTemplateCode(templateCode).stream()
                        .map(TemplateSegment::getSegmentCode).findFirst().orElse("SEG_STANDARD")
                : "SEG_STANDARD";

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("variantCode", v.getCode());
        m.put("configCode", configCode);
        m.put("amount", BigDecimal.valueOf(amount));
        m.put("amountMin", BigDecimal.valueOf(amountMin));
        m.put("amountMax", BigDecimal.valueOf(amountMax));
        m.put("months", months);
        m.put("monthsMin", monthsMin);
        m.put("monthsMax", monthsMax);
        m.put("termLimit", monthsMax);
        m.put("baseRatePct", rate);
        m.put("assetValue", assetValue);
        m.put("segmentCode", segmentCode);
        m.put("startDate", LocalDate.now().plusDays(30).toString());
        m.put("appraisalFee", appraisalFee);
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

    /** "300.000đ" → 300000L (bỏ dấu chấm phân cách nghìn + ký hiệu "đ"). */
    private static Long parseVndAmount(String text) {
        if (text == null) return null;
        Matcher m = VND_TOKEN.matcher(text);
        if (!m.find()) return null;
        return Long.parseLong(m.group(1).replace(".", "").replace(",", ""));
    }

    /** "5 ngày" → 5 (số nguyên đầu tiên tìm thấy). */
    private static Integer parseFirstInt(String text) {
        if (text == null) return null;
        Matcher m = INT_RANGE_TOKEN.matcher(text);
        if (!m.find()) return null;
        return Integer.parseInt(m.group(1));
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
