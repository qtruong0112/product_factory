package com.f88.productfactory.simulation;

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
    private Integer graceMonths;

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
    public Integer getGraceMonths() { return graceMonths; }
    public void setGraceMonths(Integer v) { this.graceMonths = v; }

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
