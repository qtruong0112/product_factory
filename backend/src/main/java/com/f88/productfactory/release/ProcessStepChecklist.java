package com.f88.productfactory.release;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/**
 * Bảng process_step_checklist — mục checklist của từng bước quy trình. Composite PK
 * (process_id, step_no, sort_order). Entity read-only.
 */
@Entity
@Table(name = "process_step_checklist")
@IdClass(ProcessStepChecklistId.class)
public class ProcessStepChecklist {

    @Id
    @Column(name = "process_id", nullable = false)
    private Long processId;

    @Id
    @Column(name = "step_no", nullable = false)
    private Short stepNo;

    @Id
    @Column(name = "sort_order", nullable = false)
    private Short sortOrder;

    @Column(name = "item", length = 255, nullable = false)
    private String item;

    @Column(name = "is_done", nullable = false)
    private boolean done;

    public Long getProcessId() { return processId; }
    public Short getStepNo() { return stepNo; }
    public Short getSortOrder() { return sortOrder; }
    public String getItem() { return item; }
    public boolean isDone() { return done; }
}
