package com.f88.productfactory.application.service.simulation;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.f88.productfactory.application.dto.simulation.SimulationRequest;

/**
 * Công cụ tính annuity dư nợ giảm dần cho Simulation Engine — cổng Java của `simData()`/
 * `annuity()` trong bundler prototype (KHÔNG ghi DB, chỉ tính runtime cho `POST /api/simulation/run`).
 *
 * Lãi hiệu lực = base_rate_pct + điều chỉnh theo tier (`standard`=0, `loyalty`=−0.3,
 * `vip`=−0.5 — khớp đúng tên hiển thị thật trong seed `customer_segment.name`, VIP ưu đãi cao
 * hơn Thân thiết theo đúng thứ tự thông thường, Giai đoạn 49), sàn 0.3%/tháng.
 *
 * Giai đoạn 50 — EMI (số tiền trả mỗi kỳ) tính trên "Chi phí vay" (CPV) GỘP lãi + phí quản lý
 * theo kỳ (trước đây PMT chỉ tính trên lãi rồi cộng phí riêng, khiến EMI trôi dần thay vì cố định
 * khi có phí — bug thật, đối chiếu ra từ file Excel tham chiếu của công ty). CPV mỗi kỳ tính theo
 * SỐ NGÀY THẬT trong tháng lịch (28-31 ngày) chia 365 (khớp cách công ty tính), không cố định "1 kỳ
 * = 1 tháng chẵn": `cpv = dư_nợ_đầu_kỳ × (rTotal×12/365) × số_ngày_thật_kỳ_đó`, rồi tách lại thành
 * Lãi/Phí theo đúng tỷ lệ cấu thành (rMonth/rTotal, feeMonth/rTotal). Vì mỗi kỳ dài ngắn khác nhau
 * (28-31 ngày) nên KHÔNG có công thức annuity đóng chính xác cho EMI — `solveEmiByDays()` giải lặp
 * (bisection) tìm EMI sao cho chạy hết lịch theo đúng số ngày thật thì dư nợ về đúng 0, khớp cách
 * Excel tham chiếu tính (thay vì công thức annuity đóng giả định mọi kỳ dài bằng nhau). Kỳ cuối vẫn
 * giữ "plug" (trả hết phần dư nợ còn lại) đề phòng sai số làm tròn dồn nhỏ còn sót lại.
 *
 * Ân hạn (grace): kỳ ân hạn gốc chỉ trả lãi+phí (CPV), gốc dồn qua kỳ sau, PMT tính trên số kỳ còn lại
 * sau ân hạn. Ân hạn lãi (interestGrace): kỳ hoàn toàn không trả gì — lãi phát sinh được nhập vào
 * dư nợ (capitalized interest); sau kỳ ân hạn lãi, dư nợ mới = gốc gốc + lãi tích lũy, PMT tính lại
 * trên dư nợ mới. Hai loại ân hạn có thể dùng độc lập, không xếp chồng.
 * Trả bớt gốc (prepay) tại 1 kỳ chỉ định → tái tính PMT phần dư nợ còn lại. Tất toán sớm
 * (early) tại 1 kỳ chỉ định → trả hết dư nợ + phí phạt %, kết thúc lịch sớm.
 * Phạt trễ hạn (penalty) tại 1 kỳ chỉ định = PMT × (số ngày trễ TÍNH PHẠT/30) × lãi suất × hệ số
 * phạt (mặc định 1.5 = trần 150% theo attribute_constraint 'penalty_rate', có thể ghi đè qua
 * request). Số ngày trễ tính phạt = max(0, số ngày trễ nhập − số ngày ân hạn THẬT của sản phẩm
 * (`graceDays`, slot `grace`/BLK_PENALTY, Giai đoạn 47) — khác `graceMonths` bên dưới (ân hạn gốc
 * đầu kỳ vay, do người dùng tự bật, không có nguồn per-product).
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
        int interestGrace = req.isInterestGraceOn() ? clamp(req.getInterestGraceMonths() != null ? req.getInterestGraceMonths() : 0, 0, months - 1) : 0;
        // Hai loại ân hạn không xếp chồng: nếu cả hai bật, ân hạn lãi ưu tiên trước, ân hạn gốc nối tiếp sau.
        // Ở đây đơn giản hóa: dùng độc lập (người dùng chỉ bật 1 loại tại 1 thời điểm).
        LocalDate start = req.getStartDate() != null ? req.getStartDate() : LocalDate.now().plusDays(30);
        double appraisalFee = req.getAppraisalFee() != null ? req.getAppraisalFee().doubleValue() : 0;

        BigDecimal segAdj = segmentAdjustment(segmentTier);
        BigDecimal effRate = baseRatePct.add(segAdj).max(new BigDecimal("0.3"));
        double r = effRate.doubleValue() / 100.0;
        double feeMonth = periodicFeePct.doubleValue() / 100.0;
        // Giai đoạn 50: EMI tính trên rate GỘP lãi+phí (rTotal), không chỉ lãi — xem class-doc.
        double rTotal = r + feeMonth;
        double dailyRateTotal = rTotal * 12.0 / 365.0;
        // Hệ số phạt trễ hạn lấy THẬT từ attribute_constraint 'penalty_rate' (regulatory, ≤150% lãi
        // trong hạn) qua SimulationController; fallback 1.5 (=150%) nếu request không kèm theo.
        double penaltyFactor = req.getPenaltyFactor() != null ? req.getPenaltyFactor().doubleValue() / 100.0 : 1.5;

        double balance = amount.doubleValue();
        double pmt = solveEmiByDays(balance, dailyRateTotal, start, grace, months - grace);
        double maxBar = pmt * 1.6;

        List<Map<String, Object>> schedule = new ArrayList<>();
        List<Map<String, Object>> chart = new ArrayList<>();
        List<Double> periodTotals = new ArrayList<>();
        double totalInterest = 0, totalPrincipal = 0, totalFee = 0, totalPenalty = 0, totalPrepay = 0, totalEarlyPenalty = 0;
        int breakevenPeriod = -1;
        double cumulativePayment = 0;
        int periodsUsed = 0;

        int scheduledPeriods = months - grace - interestGrace;
        for (int period = 1; period <= months; period++) {
            double opening = balance;
            LocalDate periodStartDate = start.plusMonths(period - 1);
            LocalDate periodEndDate = start.plusMonths(period);
            long daysInPeriod = ChronoUnit.DAYS.between(periodStartDate, periodEndDate);
            boolean inGrace = period <= grace;
            boolean inInterestGrace = !inGrace && period <= grace + interestGrace;
            // Chi phí vay (CPV) gộp lãi+phí kỳ đó, tính theo số ngày thật/365 — xem class-doc.
            double cpv = opening * dailyRateTotal * daysInPeriod;
            double interest = rTotal > 0 ? cpv * (r / rTotal) : 0;
            double fee = rTotal > 0 ? cpv * (feeMonth / rTotal) : 0;
            // Ân hạn lãi: không trả gì, lãi nhập vào balance. Ân hạn gốc: chỉ trả lãi+phí (CPV).
            double principal = (inGrace || inInterestGrace) ? 0 : Math.min(pmt - cpv, opening);
            // Trong kỳ ân hạn lãi: lãi+phí không thu mà cộng vào dư nợ.
            if (inInterestGrace) {
                interest = 0;
                fee = 0;
            }
            // Plug kỳ cuối lịch gốc: trả hết phần dư nợ còn lại thay vì đúng PMT cố định, bù sai số
            // dồn từ số ngày mỗi tháng khác nhau — khớp hành vi file Excel tham chiếu.
            boolean isLastScheduled = !inGrace && !inInterestGrace && (period - grace - interestGrace) == scheduledPeriods;
            if (!inGrace && !inInterestGrace && (isLastScheduled || opening - principal < 1)) {
                principal = opening;
            }

            boolean isPenalty = req.isPenaltyOn() && req.getPenaltyPeriod() != null && period == req.getPenaltyPeriod()
                    && !inGrace && !inInterestGrace;
            double penalty = 0;
            if (isPenalty) {
                int days = req.getPenaltyDays() != null ? req.getPenaltyDays() : 0;
                int graceDays = req.getGraceDays() != null ? req.getGraceDays() : 0;
                int billableDays = Math.max(0, days - graceDays);
                penalty = pmt * (billableDays / 30.0) * r * penaltyFactor;
                totalPenalty += penalty;
            }

            boolean isPrepay = req.isPrepayOn() && !inGrace && !inInterestGrace && req.getPrepayPeriod() != null && period == req.getPrepayPeriod();
            double prepayExtra = 0;
            if (isPrepay && req.getPrepayAmount() != null) {
                prepayExtra = Math.min(req.getPrepayAmount().doubleValue(), Math.max(0, opening - principal));
                totalPrepay += prepayExtra;
            }

            boolean isEarly = req.isEarlyOn() && req.getEarlyPeriod() != null && period == req.getEarlyPeriod()
                    && !inGrace && !inInterestGrace
                    && (opening - principal - prepayExtra) > 1;
            double earlyAmount = 0, earlyPenalty = 0;
            if (isEarly) {
                earlyAmount = Math.max(0, opening - principal - prepayExtra);
                BigDecimal pct = req.getEarlyPenaltyPct() != null ? req.getEarlyPenaltyPct() : BigDecimal.ZERO;
                earlyPenalty = earlyAmount * pct.doubleValue() / 100.0;
                totalEarlyPenalty += earlyPenalty;
            }

            // Ân hạn lãi: lãi+phí nhập vào balance (không thu tiền), không tính vào closing thông thường.
            double accrued = inInterestGrace ? (opening * dailyRateTotal * daysInPeriod) : 0;
            double closing = isEarly ? 0 : Math.max(0, opening - principal - prepayExtra + accrued);
            double payment = principal + interest + fee + penalty + prepayExtra + earlyAmount + earlyPenalty;

            String tagText = null, tagColor = null, rowBg = "#fff";
            if (isEarly) {
                tagText = "Tất toán sớm · phạt " + formatVnd(earlyPenalty) + "đ"; tagColor = "#B23B3B"; rowBg = "#FEF6F6";
            } else if (inInterestGrace) {
                tagText = "Ân hạn lãi · lãi nhập gốc"; tagColor = "#7A4FC7"; rowBg = "#F7F3FE";
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
            row.put("periodStart", periodStartDate.format(DATE_FMT));
            row.put("periodEnd", periodEndDate.format(DATE_FMT));
            row.put("dueDate", periodEndDate.toString());
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
                pmt = solveEmiByDays(balance, dailyRateTotal, start, grace, months - grace - interestGrace);
            } else if (period == grace + interestGrace && interestGrace > 0) {
                // Sau kỳ ân hạn lãi: dư nợ mới = gốc + lãi tích lũy → tính lại PMT.
                pmt = solveEmiByDays(balance, dailyRateTotal, start, grace + interestGrace, months - grace - interestGrace);
            } else if (prepayExtra > 0 && balance > 1) {
                pmt = solveEmiByDays(balance, dailyRateTotal, start, period, months - period);
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
        // Trần LTV/lãi suất lấy THẬT từ attribute_constraint (kind='regulatory') qua SimulationController;
        // fallback về giá trị gốc chỉ khi request không kèm theo (gọi /run trực tiếp không qua /default).
        BigDecimal ltvCap = req.getLtvCapPct() != null ? req.getLtvCapPct() : new BigDecimal("80");
        BigDecimal rateCap = req.getRateCapPct() != null ? req.getRateCapPct() : new BigDecimal("1.65");

        List<Map<String, Object>> checks = new ArrayList<>();
        checks.add(check("Số tiền trong hạn mức cấp", "Limit cho phép " + formatVnd(amtMin.doubleValue()) + "đ – " + formatVnd(amtMax.doubleValue()) + "đ", formatVnd(amount.doubleValue()) + "đ",
                amount.compareTo(amtMin) >= 0 && amount.compareTo(amtMax) <= 0));
        checks.add(check("Tỷ lệ cho vay LTV ≤ " + ltvCap.stripTrailingZeros().toPlainString() + "%", "LTV = số tiền vay / giá trị tài sản", (ltvPct == null ? "—" : ltvPct + "%"),
                ltvPct == null || ltvPct.compareTo(ltvCap) <= 0));
        checks.add(check("Lãi suất ≤ trần quy định", "Trần " + rateCap.stripTrailingZeros().toPlainString() + "%/tháng theo quy định nội bộ", effRate.setScale(2, RoundingMode.HALF_UP) + "%/th",
                effRate.compareTo(rateCap) <= 0));
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
        result.put("graceDaysApplied", req.getGraceDays() != null ? req.getGraceDays() : 0);
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

    /**
     * Giải lặp (bisection) tìm EMI cố định sao cho chạy hết `periodsCount` kỳ kế tiếp — mỗi kỳ tính
     * CPV theo đúng số ngày lịch thật (`scheduleStart.plusMonths(periodOffset+i)` .. `+i+1`) và
     * `dailyRate` — thì dư nợ về đúng 0. Không có công thức annuity đóng chính xác vì mỗi kỳ dài
     * ngắn khác nhau (28-31 ngày) — khớp cách file Excel tham chiếu tính (Giai đoạn 50).
     */
    private static double solveEmiByDays(double balance, double dailyRate, LocalDate scheduleStart, int periodOffset, int periodsCount) {
        if (periodsCount <= 0 || balance <= 0) return balance;
        double lo = balance / periodsCount;
        double hi = balance;
        for (int iter = 0; iter < 100; iter++) {
            double mid = (lo + hi) / 2;
            double bal = balance;
            for (int i = 0; i < periodsCount; i++) {
                LocalDate s = scheduleStart.plusMonths(periodOffset + i);
                LocalDate e = scheduleStart.plusMonths(periodOffset + i + 1);
                long days = ChronoUnit.DAYS.between(s, e);
                double cpv = bal * dailyRate * days;
                bal -= (mid - cpv);
            }
            if (bal > 0) lo = mid; else hi = mid;
        }
        return (lo + hi) / 2;
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
            case "loyalty" -> new BigDecimal("-0.3");
            case "vip" -> new BigDecimal("-0.5");
            default -> BigDecimal.ZERO;
        };
    }
}
