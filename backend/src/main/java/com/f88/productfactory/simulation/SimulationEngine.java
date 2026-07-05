package com.f88.productfactory.simulation;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Công cụ tính annuity dư nợ giảm dần cho Simulation Engine — cổng Java của `simData()`/
 * `annuity()` trong bundler prototype (KHÔNG ghi DB, chỉ tính runtime cho `POST /api/simulation/run`).
 *
 * Lãi hiệu lực = base_rate_pct + điều chỉnh theo tier (`standard`=0, `loyalty`=−0.5,
 * `vip`=−0.3 — khớp đúng tên hiển thị thật trong seed `customer_segment.name`, không bịa),
 * sàn 0.3%/tháng. Ân hạn (grace): kỳ ân hạn chỉ trả lãi+phí, gốc dồn qua kỳ sau, PMT tính trên
 * số kỳ còn lại sau ân hạn. Trả bớt gốc (prepay) tại 1 kỳ chỉ định → tái tính PMT phần dư nợ còn
 * lại. Tất toán sớm (early) tại 1 kỳ chỉ định → trả hết dư nợ + phí phạt %, kết thúc lịch sớm.
 * Phạt trễ hạn (penalty) tại 1 kỳ chỉ định = PMT × (số ngày trễ/30) × lãi suất × 1.5.
 *
 * Ngoài lịch trả nợ, còn tính thêm dữ liệu biểu đồ Cashflow (chart bar %, đường thu hồi lũy kế,
 * điểm hòa vốn, đường vốn giải ngân) — cổng đúng công thức `simData()` đoạn cuối của bundler.
 */
public final class SimulationEngine {

    private SimulationEngine() {}

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public static Map<String, Object> run(SimulationRequest req, String segmentTier) {
        BigDecimal amount = req.getAmount();
        int months = req.getMonths();
        BigDecimal baseRatePct = req.getBaseRatePct();
        BigDecimal periodicFeePct = req.getPeriodicFeePct() != null ? req.getPeriodicFeePct() : BigDecimal.ZERO;
        int grace = req.isGraceOn() ? clamp(req.getGraceMonths() != null ? req.getGraceMonths() : 0, 0, months - 1) : 0;
        LocalDate start = req.getStartDate() != null ? req.getStartDate() : LocalDate.now().plusDays(30);
        double appraisalFee = req.getAppraisalFee() != null ? req.getAppraisalFee().doubleValue() : 0;

        BigDecimal segAdj = segmentAdjustment(segmentTier);
        BigDecimal effRate = baseRatePct.add(segAdj).max(new BigDecimal("0.3"));
        double r = effRate.doubleValue() / 100.0;

        double balance = amount.doubleValue();
        double pmt = annuity(balance, r, months - grace);
        double maxBar = pmt * 1.6;

        List<Map<String, Object>> schedule = new ArrayList<>();
        List<Map<String, Object>> chart = new ArrayList<>();
        List<Double> periodTotals = new ArrayList<>();
        double totalInterest = 0, totalPrincipal = 0, totalFee = 0, totalPenalty = 0, totalPrepay = 0, totalEarlyPenalty = 0;
        int breakevenPeriod = -1;
        double cumulativePayment = 0;
        int periodsUsed = 0;

        for (int period = 1; period <= months; period++) {
            double opening = balance;
            double interest = opening * r;
            double fee = opening * periodicFeePct.doubleValue() / 100.0;
            boolean inGrace = period <= grace;
            double principal = inGrace ? 0 : Math.min(pmt - interest, opening);

            boolean isPenalty = req.isPenaltyOn() && req.getPenaltyPeriod() != null && period == req.getPenaltyPeriod();
            double penalty = 0;
            if (isPenalty) {
                int days = req.getPenaltyDays() != null ? req.getPenaltyDays() : 0;
                penalty = pmt * (days / 30.0) * r * 1.5;
                totalPenalty += penalty;
            }

            boolean isPrepay = req.isPrepayOn() && !inGrace && req.getPrepayPeriod() != null && period == req.getPrepayPeriod();
            double prepayExtra = 0;
            if (isPrepay && req.getPrepayAmount() != null) {
                prepayExtra = Math.min(req.getPrepayAmount().doubleValue(), Math.max(0, opening - principal));
                totalPrepay += prepayExtra;
            }

            boolean isEarly = req.isEarlyOn() && req.getEarlyPeriod() != null && period == req.getEarlyPeriod()
                    && (opening - principal - prepayExtra) > 1;
            double earlyAmount = 0, earlyPenalty = 0;
            if (isEarly) {
                earlyAmount = Math.max(0, opening - principal - prepayExtra);
                BigDecimal pct = req.getEarlyPenaltyPct() != null ? req.getEarlyPenaltyPct() : BigDecimal.ZERO;
                earlyPenalty = earlyAmount * pct.doubleValue() / 100.0;
                totalEarlyPenalty += earlyPenalty;
            }

            double closing = isEarly ? 0 : Math.max(0, opening - principal - prepayExtra);
            double payment = principal + interest + fee + penalty + prepayExtra + earlyAmount + earlyPenalty;

            String tagText = null, tagColor = null, rowBg = "#fff";
            if (isEarly) {
                tagText = "Tất toán sớm · phạt " + formatVnd(earlyPenalty) + "đ"; tagColor = "#B23B3B"; rowBg = "#FEF6F6";
            } else if (inGrace) {
                tagText = "Ân hạn · chỉ trả lãi"; tagColor = "#9A6B00"; rowBg = "#FFFBF0";
            } else if (isPenalty && isPrepay) {
                tagText = "Phạt + Trả bớt gốc"; tagColor = "#B23B3B"; rowBg = "#FEF6F6";
            } else if (isPenalty) {
                tagText = "Trễ " + (req.getPenaltyDays() != null ? req.getPenaltyDays() : 0) + " ngày · phạt"; tagColor = "#B23B3B"; rowBg = "#FEF6F6";
            } else if (isPrepay) {
                tagText = "Trả bớt gốc " + formatVnd(prepayExtra) + "đ"; tagColor = "#0B7349"; rowBg = "#F4FBF7";
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("periodNo", period);
            row.put("periodStart", start.plusMonths(period - 1).format(DATE_FMT));
            row.put("periodEnd", start.plusMonths(period).format(DATE_FMT));
            row.put("dueDate", start.plusMonths(period).toString());
            row.put("openingBalance", round(opening));
            row.put("principal", round(principal + earlyAmount));
            row.put("interest", round(interest));
            row.put("fee", round(fee));
            row.put("penalty", round(penalty + earlyPenalty));
            row.put("prepay", round(prepayExtra));
            row.put("payment", round(payment));
            row.put("closingBalance", round(closing));
            row.put("hasTag", tagText != null);
            row.put("tagText", tagText);
            row.put("tagColor", tagColor);
            row.put("rowBg", rowBg);
            schedule.add(row);

            Map<String, Object> bar = new LinkedHashMap<>();
            bar.put("period", period);
            bar.put("label", period);
            bar.put("showLabel", months <= 18 || period == 1 || period == months || period % 3 == 0);
            bar.put("priH", pct(principal + earlyAmount, maxBar));
            bar.put("intH", pct(interest, maxBar));
            bar.put("feeH", pct(fee + penalty + earlyPenalty, maxBar));
            chart.add(bar);

            totalInterest += interest;
            totalPrincipal += principal + earlyAmount;
            totalFee += fee;
            cumulativePayment += payment;
            periodTotals.add(payment);
            if (breakevenPeriod < 0 && cumulativePayment >= amount.doubleValue()) breakevenPeriod = period;

            balance = closing;
            periodsUsed = period;

            if (isEarly) break;
            if (period == grace && grace > 0) {
                pmt = annuity(balance, r, months - grace);
            } else if (prepayExtra > 0 && balance > 1) {
                pmt = annuity(balance, r, months - period);
            }
            if (balance <= 1) break;
        }

        BigDecimal ltvPct = null;
        if (req.getAssetValue() != null && req.getAssetValue().signum() > 0) {
            ltvPct = amount.divide(req.getAssetValue(), 6, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP);
        }

        // Khoảng hạn mức/kỳ hạn hợp lệ lấy THẬT theo config đang chọn (amountMin/amountMax/monthsMax
        // suy từ limit_range/installment_count thật) — fallback về khoảng của CFG-0042/VAR-101 gốc
        // (3tr–50tr, ≤18 tháng) nếu request không gửi kèm (vd gọi trực tiếp không qua /default).
        BigDecimal amtMin = req.getAmountMin() != null ? req.getAmountMin() : new BigDecimal("3000000");
        BigDecimal amtMax = req.getAmountMax() != null ? req.getAmountMax() : new BigDecimal("50000000");
        int termMax = req.getTermLimit() != null ? req.getTermLimit() : 18;

        List<Map<String, Object>> checks = new ArrayList<>();
        checks.add(check("Số tiền trong hạn mức cấp", "Limit cho phép " + formatVnd(amtMin.doubleValue()) + "đ – " + formatVnd(amtMax.doubleValue()) + "đ", formatVnd(amount.doubleValue()) + "đ",
                amount.compareTo(amtMin) >= 0 && amount.compareTo(amtMax) <= 0));
        checks.add(check("Tỷ lệ cho vay LTV ≤ 80%", "LTV = số tiền vay / giá trị tài sản", (ltvPct == null ? "—" : ltvPct + "%"),
                ltvPct == null || ltvPct.compareTo(new BigDecimal("80")) <= 0));
        checks.add(check("Lãi suất ≤ trần quy định", "Trần 1,65%/tháng theo quy định nội bộ", effRate.setScale(2, RoundingMode.HALF_UP) + "%/th",
                effRate.compareTo(new BigDecimal("1.65")) <= 0));
        checks.add(check("Kỳ hạn hợp lệ (≤ " + termMax + " tháng)", "Answer Slot installment_count tối đa " + termMax + " kỳ", months + " tháng",
                months <= termMax));
        boolean valid = checks.stream().allMatch(c -> (boolean) c.get("passed"));

        double grossInflow = appraisalFee + cumulativePayment;
        double run = appraisalFee;
        List<String> points = new ArrayList<>();
        for (int i = 0; i < periodsUsed; i++) {
            run += periodTotals.get(i);
            double x = (i + 0.5) / periodsUsed * 100.0;
            double y = 100.0 - run / grossInflow * 100.0;
            points.add(fmt2(x) + "," + fmt2(y));
        }
        String cumPoints = String.join(" ", points);
        double capitalLineY = 100.0 - amount.doubleValue() / grossInflow * 100.0;
        Double breakevenX = breakevenPeriod > 0 ? (breakevenPeriod - 0.5) / periodsUsed * 100.0 : null;

        // Tổng phải trả = tổng mọi payment từng kỳ (đã gồm gốc+lãi+phí+phạt+tất toán) + phí thẩm định t0.
        double totalPayment = grossInflow;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("effectiveRatePct", effRate.setScale(3, RoundingMode.HALF_UP));
        result.put("monthlyPayment", round(pmt));
        result.put("totalInterest", round(totalInterest));
        // TỔNG PHÍ hiển thị gồm cả phí thẩm định t0 (khớp d.totalFee của bundler: apprFee + Σ phí theo kỳ).
        result.put("totalFee", round(totalFee + appraisalFee));
        result.put("periodicFeeOnly", round(totalFee));
        result.put("totalPrincipal", round(totalPrincipal));
        result.put("totalPenalty", round(totalPenalty));
        result.put("totalPrepay", round(totalPrepay));
        result.put("totalEarlyPenalty", round(totalEarlyPenalty));
        result.put("appraisalFee", round(appraisalFee));
        result.put("totalPayment", round(totalPayment));
        result.put("grossInflow", round(grossInflow));
        result.put("ltvPct", ltvPct);
        result.put("breakevenPeriod", breakevenPeriod > 0 ? breakevenPeriod : null);
        result.put("periodsUsed", periodsUsed);
        result.put("scheduleNote", periodsUsed + "/" + months + " kỳ");
        result.put("valid", valid);
        result.put("checks", checks);
        result.put("schedule", schedule);
        result.put("chart", chart);
        result.put("cumPoints", cumPoints);
        result.put("capitalLineY", fmt2(capitalLineY) + "%");
        result.put("breakevenX", breakevenX != null ? fmt2(breakevenX) + "%" : null);
        result.put("hasBreakeven", breakevenX != null);
        return result;
    }

    private static Map<String, Object> check(String title, String detail, String value, boolean passed) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("title", title);
        m.put("detail", detail);
        m.put("value", value);
        m.put("passed", passed);
        return m;
    }

    private static double annuity(double balance, double r, int k) {
        if (k <= 0) return balance;
        if (r <= 0) return balance / k;
        return balance * r / (1 - Math.pow(1 + r, -k));
    }

    private static String pct(double v, double max) {
        if (max <= 0) return "0.0%";
        return fmt2(Math.min(100, v / max * 86)) + "%";
    }

    private static BigDecimal round(double v) {
        return BigDecimal.valueOf(v).setScale(0, RoundingMode.HALF_UP);
    }

    private static String fmt2(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private static String formatVnd(double v) {
        return String.format("%,.0f", v).replace(',', '.');
    }

    private static int clamp(int v, int min, int max) {
        return Math.max(min, Math.min(max, v));
    }

    /** Điều chỉnh lãi theo tier — khớp đúng tên hiển thị thật trong seed customer_segment.name. */
    private static BigDecimal segmentAdjustment(String tier) {
        if (tier == null) return BigDecimal.ZERO;
        return switch (tier) {
            case "loyalty" -> new BigDecimal("-0.5");
            case "vip" -> new BigDecimal("-0.3");
            default -> BigDecimal.ZERO;
        };
    }
}
