package com.f88.productfactory.simulation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Bảng simulation_scenario — kịch bản mô phỏng mặc định (Lớp IV — Governance). Entity
 * read-only, chỉ dùng để nạp state ban đầu cho màn Simulation Engine (`GET /api/simulation/default`).
 * Việc TÍNH TOÁN thật (annuity, LTV, cashflow) chạy ở {@link SimulationEngine} — thuần Java,
 * không ghi DB (`POST /api/simulation/run`).
 */
@Entity
@Table(name = "simulation_scenario")
public class SimulationScenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "config_code", length = 20)
    private String configCode;

    @Column(name = "variant_code", length = 20)
    private String variantCode;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "months", nullable = false)
    private Short months;

    @Column(name = "base_rate_pct", nullable = false)
    private BigDecimal baseRatePct;

    @Column(name = "asset_value")
    private BigDecimal assetValue;

    @Column(name = "segment_code", length = 40)
    private String segmentCode;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "appraisal_fee")
    private BigDecimal appraisalFee;

    @Column(name = "periodic_fee_pct")
    private BigDecimal periodicFeePct;

    @Column(name = "grace_months")
    private Short graceMonths;

    @Column(name = "pinned_label", length = 1)
    private String pinnedLabel;

    public Long getId() { return id; }
    public String getConfigCode() { return configCode; }
    public String getVariantCode() { return variantCode; }
    public BigDecimal getAmount() { return amount; }
    public Short getMonths() { return months; }
    public BigDecimal getBaseRatePct() { return baseRatePct; }
    public BigDecimal getAssetValue() { return assetValue; }
    public String getSegmentCode() { return segmentCode; }
    public LocalDate getStartDate() { return startDate; }
    public BigDecimal getAppraisalFee() { return appraisalFee; }
    public BigDecimal getPeriodicFeePct() { return periodicFeePct; }
    public Short getGraceMonths() { return graceMonths; }
    public String getPinnedLabel() { return pinnedLabel; }
}
