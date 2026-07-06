package com.f88.productfactory.domain.model.release;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/**
 * Bảng process_step — 8 bước của quy trình Maker–Checker, kèm vai trò, trạng thái,
 * input/output. Composite PK (process_id, step_no). Entity read-only.
 */
@Entity
@Table(name = "process_step")
@IdClass(ProcessStepId.class)
public class ProcessStep {

    @Id
    @Column(name = "process_id", nullable = false)
    private Long processId;

    @Id
    @Column(name = "step_no", nullable = false)
    private Short stepNo;

    @Column(name = "title", length = 200, nullable = false)
    private String title;

    @Column(name = "role", nullable = false)
    private String role;

    @Column(name = "step_status", nullable = false)
    private String stepStatus;

    @Column(name = "input_desc", length = 200)
    private String inputDesc;

    @Column(name = "output_desc", length = 200)
    private String outputDesc;

    public Long getProcessId() { return processId; }
    public Short getStepNo() { return stepNo; }
    public String getTitle() { return title; }
    public String getRole() { return role; }
    public String getStepStatus() { return stepStatus; }
    public String getInputDesc() { return inputDesc; }
    public String getOutputDesc() { return outputDesc; }
}
