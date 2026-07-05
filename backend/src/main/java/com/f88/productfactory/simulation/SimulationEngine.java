package com.f88.productfactory.simulation;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
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
 */
public final class SimulationEngine {

    private SimulationEngine() {}

    public static Map<String, Object> run(SimulationRequest req, String segmentTier) {
        BigDecimal amount = req.getAmount();
        int months = req.getMonths();
        BigDecimal baseRatePct = req.getBaseRatePct();
        BigDecimal periodicFeePct = req.getPeriodicFeePct() != null ? req.getPeriodicFeePct() : BigDecimal.ZERO;
        int grace = clamp(req.getGraceMonths() != null ? req.getGraceMonths() : 0, 0, months - 1);
        LocalDate start = req.getStartDate() != null ? req.getStartDate() : LocalDate.now().plusDays(30);

        BigDecimal segAdj = segmentAdjustment(segmentTier);
        BigDecimal effRate = baseRatePct.add(segAdj).max(new BigDecimal("0.3"));
        double r = effRate.doubleValue() / 100.0;

        double balance = amount.doubleValue();
        double pmt = annuity(balance, r, months - grace);

        List<Map<String, Object>> schedule = new ArrayList<>();
        double totalInterest = 0, totalPrincipal = 0, totalFee = 0, totalPenalty = 0, totalPrepay = 0, totalEarlyPenalty = 0;
        int breakevenPeriod = -1;
        double cumulativePayment = 0;

        for (int period = 1; period <= months; period++) {
            double opening = balance;
            double interest = opening * r;
            double fee = opening * periodicFeePct.doubleValue() / 100.0;
            boolean inGrace = period <= grace;
            double principal = inGrace ? 0 : pmt - interest;

            double penalty = 0;
            if (req.isPenaltyOn() && req.getPenaltyPeriod() != null && period == req.getPenaltyPeriod()) {
                int days = req.getPenaltyDays() != null ? req.getPenaltyDays() : 0;
                penalty = pmt * (days / 30.0) * r * 1.5;
                totalPenalty += penalty;
            }

            double prepayExtra = 0;
            if (req.isPrepayOn() && req.getPrepayPeriod() != null && period == req.getPrepayPeriod() && req.getPrepayAmount() != null) {
                prepayExtra = Math.min(req.getPrepayAmount().doubleValue(), Math.max(0, opening - principal));
                totalPrepay += prepayExtra;
            }

            double closing = opening - principal - prepayExtra;

            double earlyPenalty = 0;
            boolean isEarly = req.isEarlyOn() && req.getEarlyPeriod() != null && period == req.getEarlyPeriod();
            if (isEarly && closing > 0) {
                BigDecimal pct = req.getEarlyPenaltyPct() != null ? req.getEarlyPenaltyPct() : BigDecimal.ZERO;
                earlyPenalty = closing * pct.doubleValue() / 100.0;
                totalEarlyPenalty += earlyPenalty;
                principal += closing;
                closing = 0;
            }

            double payment = principal + interest + fee + penalty + earlyPenalty;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("periodNo", period);
            row.put("dueDate", start.plusMonths(period).toString());
            row.put("openingBalance", round(opening));
            row.put("principal", round(principal));
            row.put("interest", round(interest));
            row.put("fee", round(fee));
            row.put("penalty", round(penalty));
            row.put("payment", round(payment));
            row.put("closingBalance", round(closing));
            schedule.add(row);

            totalInterest += interest;
            totalPrincipal += principal;
            totalFee += fee;
            cumulativePayment += payment;
            if (breakevenPeriod < 0 && cumulativePayment >= amount.doubleValue()) breakevenPeriod = period;

            balance = closing;

            if (prepayExtra > 0 && balance > 0 && period < months) {
                pmt = annuity(balance, r, months - period);
            }
            if (balance <= 0) break;
        }

        BigDecimal ltvPct = null;
        if (req.getAssetValue() != null && req.getAssetValue().signum() > 0) {
            ltvPct = amount.divide(req.getAssetValue(), 6, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP);
        }

        List<Map<String, Object>> checks = new ArrayList<>();
        checks.add(check("Hạn mức 3.000.000 – 50.000.000đ",
                amount.compareTo(new BigDecimal("3000000")) >= 0 && amount.compareTo(new BigDecimal("50000000")) <= 0));
        checks.add(check("LTV ≤ 80%", ltvPct == null || ltvPct.compareTo(new BigDecimal("80")) <= 0));
        checks.add(check("Lãi suất hiệu lực ≤ 1.65%/tháng", effRate.compareTo(new BigDecimal("1.65")) <= 0));
        checks.add(check("Kỳ hạn ≤ 36 tháng", months <= 36));
        boolean valid = checks.stream().allMatch(c -> (boolean) c.get("passed"));

        double appraisalFee = req.getAppraisalFee() != null ? req.getAppraisalFee().doubleValue() : 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("effectiveRatePct", effRate.setScale(3, RoundingMode.HALF_UP));
        result.put("monthlyPayment", round(pmt));
        result.put("totalInterest", round(totalInterest));
        result.put("totalFee", round(totalFee));
        result.put("totalPrincipal", round(totalPrincipal));
        result.put("totalPenalty", round(totalPenalty));
        result.put("totalPrepay", round(totalPrepay));
        result.put("totalEarlyPenalty", round(totalEarlyPenalty));
        // Tổng phải trả = lịch trả nợ (gốc+lãi+phí quản lý+phạt) + phí thẩm định 1 lần lúc giải ngân
        // (khớp seed simulation_scenario.total_payment = 35.400.634 = 34.900.634 + 500.000 appraisal_fee).
        result.put("totalPayment", round(totalInterest + totalPrincipal + totalFee + totalPenalty + totalEarlyPenalty + appraisalFee));
        result.put("ltvPct", ltvPct);
        result.put("breakevenPeriod", breakevenPeriod);
        result.put("valid", valid);
        result.put("checks", checks);
        result.put("schedule", schedule);
        return result;
    }

    private static Map<String, Object> check(String label, boolean passed) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("label", label);
        m.put("passed", passed);
        return m;
    }

    private static double annuity(double balance, double r, int k) {
        if (k <= 0) return balance;
        if (r <= 0) return balance / k;
        return balance * r / (1 - Math.pow(1 + r, -k));
    }

    private static BigDecimal round(double v) {
        return BigDecimal.valueOf(v).setScale(0, RoundingMode.HALF_UP);
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
