package com.f88.productfactory.simulation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Bảng simulation_schedule_row — lịch trả nợ từng kỳ của kịch bản mặc định. Composite PK
 * (scenario_id, period_no). Entity read-only, chỉ dùng để nạp state ban đầu.
 */
@Entity
@Table(name = "simulation_schedule_row")
@IdClass(SimulationScheduleRowId.class)
public class SimulationScheduleRow {

    @Id
    @Column(name = "scenario_id", nullable = false)
    private Long scenarioId;

    @Id
    @Column(name = "period_no", nullable = false)
    private Short periodNo;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "opening_balance", nullable = false)
    private BigDecimal openingBalance;

    @Column(name = "principal", nullable = false)
    private BigDecimal principal;

    @Column(name = "interest", nullable = false)
    private BigDecimal interest;

    @Column(name = "fee")
    private BigDecimal fee;

    @Column(name = "penalty")
    private BigDecimal penalty;

    @Column(name = "payment", nullable = false)
    private BigDecimal payment;

    @Column(name = "closing_balance", nullable = false)
    private BigDecimal closingBalance;

    public Long getScenarioId() { return scenarioId; }
    public Short getPeriodNo() { return periodNo; }
    public LocalDate getDueDate() { return dueDate; }
    public BigDecimal getOpeningBalance() { return openingBalance; }
    public BigDecimal getPrincipal() { return principal; }
    public BigDecimal getInterest() { return interest; }
    public BigDecimal getFee() { return fee; }
    public BigDecimal getPenalty() { return penalty; }
    public BigDecimal getPayment() { return payment; }
    public BigDecimal getClosingBalance() { return closingBalance; }
}
