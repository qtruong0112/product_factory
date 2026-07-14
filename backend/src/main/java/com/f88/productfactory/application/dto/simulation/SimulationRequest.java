package com.f88.productfactory.application.dto.simulation;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Tham số đầu vào cho POST /api/simulation/run — không ghi DB, chỉ tính runtime.
 * Các trường tình huống (penalty/prepay/early) không có cột lưu trong `simulation_scenario`
 * (chỉ ảnh hưởng phép tính lúc chạy, đúng bản chất "mô phỏng" của prototype).
 */
public class SimulationRequest {
    private String variantCode;
    private String configCode;
    private BigDecimal amount;
    private Integer months;
    private BigDecimal baseRatePct;
    private BigDecimal assetValue;
    private String segmentCode;
    private LocalDate startDate;
    private BigDecimal appraisalFee;
    private BigDecimal periodicFeePct;
    private boolean graceOn;
    private Integer graceMonths;
    // Ân hạn lãi: kỳ không trả gì, lãi phát sinh nhập vào dư nợ (capitalized interest).
    private boolean interestGraceOn;
    private Integer interestGraceMonths;

    // Khoảng hạn mức/kỳ hạn THẬT của config đang chọn (suy từ limit_range/installment_count) —
    // dùng để kiểm tra ràng buộc "trong hạn mức"/"kỳ hạn hợp lệ" đúng theo từng sản phẩm, thay vì
    // hardcode 1 khoảng cố định như bundler gốc (vốn chỉ mô phỏng đúng 1 sản phẩm duy nhất).
    private BigDecimal amountMin;
    private BigDecimal amountMax;
    private Integer termLimit;

    // Trần quy định (LTV/lãi suất/hệ số phạt) lấy THẬT từ attribute_constraint (kind='regulatory')
    // — xem SimulationController — thay vì hardcode trong SimulationEngine.
    private BigDecimal ltvCapPct;
    private BigDecimal rateCapPct;
    private BigDecimal penaltyFactor;

    // Số ngày trễ hạn được miễn phạt — chính sách THẬT của sản phẩm (slot `grace`, BLK_PENALTY),
    // resolve theo configCode trong SimulationService#applyRegulatoryCaps, không phải input người
    // dùng nhập. Khác khái niệm với `graceMonths` (ân hạn gốc đầu kỳ vay, người dùng tự bật).
    private Integer graceDays;

    private boolean penaltyOn;
    private Integer penaltyPeriod;
    private Integer penaltyDays;

    private boolean prepayOn;
    private Integer prepayPeriod;
    private BigDecimal prepayAmount;

    private boolean earlyOn;
    private Integer earlyPeriod;
    private BigDecimal earlyPenaltyPct;

    public String getVariantCode() { return variantCode; }
    public void setVariantCode(String v) { this.variantCode = v; }
    public String getConfigCode() { return configCode; }
    public void setConfigCode(String v) { this.configCode = v; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal v) { this.amount = v; }
    public Integer getMonths() { return months; }
    public void setMonths(Integer v) { this.months = v; }
    public BigDecimal getBaseRatePct() { return baseRatePct; }
    public void setBaseRatePct(BigDecimal v) { this.baseRatePct = v; }
    public BigDecimal getAssetValue() { return assetValue; }
    public void setAssetValue(BigDecimal v) { this.assetValue = v; }
    public String getSegmentCode() { return segmentCode; }
    public void setSegmentCode(String v) { this.segmentCode = v; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate v) { this.startDate = v; }
    public BigDecimal getAppraisalFee() { return appraisalFee; }
    public void setAppraisalFee(BigDecimal v) { this.appraisalFee = v; }
    public BigDecimal getPeriodicFeePct() { return periodicFeePct; }
    public void setPeriodicFeePct(BigDecimal v) { this.periodicFeePct = v; }
    public boolean isGraceOn() { return graceOn; }
    public void setGraceOn(boolean v) { this.graceOn = v; }
    public Integer getGraceMonths() { return graceMonths; }
    public void setGraceMonths(Integer v) { this.graceMonths = v; }
    public boolean isInterestGraceOn() { return interestGraceOn; }
    public void setInterestGraceOn(boolean v) { this.interestGraceOn = v; }
    public Integer getInterestGraceMonths() { return interestGraceMonths; }
    public void setInterestGraceMonths(Integer v) { this.interestGraceMonths = v; }
    public BigDecimal getAmountMin() { return amountMin; }
    public void setAmountMin(BigDecimal v) { this.amountMin = v; }
    public BigDecimal getAmountMax() { return amountMax; }
    public void setAmountMax(BigDecimal v) { this.amountMax = v; }
    public Integer getTermLimit() { return termLimit; }
    public void setTermLimit(Integer v) { this.termLimit = v; }
    public BigDecimal getLtvCapPct() { return ltvCapPct; }
    public void setLtvCapPct(BigDecimal v) { this.ltvCapPct = v; }
    public BigDecimal getRateCapPct() { return rateCapPct; }
    public void setRateCapPct(BigDecimal v) { this.rateCapPct = v; }
    public BigDecimal getPenaltyFactor() { return penaltyFactor; }
    public void setPenaltyFactor(BigDecimal v) { this.penaltyFactor = v; }
    public Integer getGraceDays() { return graceDays; }
    public void setGraceDays(Integer v) { this.graceDays = v; }

    public boolean isPenaltyOn() { return penaltyOn; }
    public void setPenaltyOn(boolean v) { this.penaltyOn = v; }
    public Integer getPenaltyPeriod() { return penaltyPeriod; }
    public void setPenaltyPeriod(Integer v) { this.penaltyPeriod = v; }
    public Integer getPenaltyDays() { return penaltyDays; }
    public void setPenaltyDays(Integer v) { this.penaltyDays = v; }

    public boolean isPrepayOn() { return prepayOn; }
    public void setPrepayOn(boolean v) { this.prepayOn = v; }
    public Integer getPrepayPeriod() { return prepayPeriod; }
    public void setPrepayPeriod(Integer v) { this.prepayPeriod = v; }
    public BigDecimal getPrepayAmount() { return prepayAmount; }
    public void setPrepayAmount(BigDecimal v) { this.prepayAmount = v; }

    public boolean isEarlyOn() { return earlyOn; }
    public void setEarlyOn(boolean v) { this.earlyOn = v; }
    public Integer getEarlyPeriod() { return earlyPeriod; }
    public void setEarlyPeriod(Integer v) { this.earlyPeriod = v; }
    public BigDecimal getEarlyPenaltyPct() { return earlyPenaltyPct; }
    public void setEarlyPenaltyPct(BigDecimal v) { this.earlyPenaltyPct = v; }
}
