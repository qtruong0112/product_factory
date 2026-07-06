package com.f88.productfactory.domain.model.release;

import java.io.Serializable;
import java.util.Objects;

/** Khóa ghép process_step_checklist (process_id, step_no, sort_order). */
public class ProcessStepChecklistId implements Serializable {
    private Long processId;
    private Short stepNo;
    private Short sortOrder;

    public ProcessStepChecklistId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProcessStepChecklistId that)) return false;
        return Objects.equals(processId, that.processId)
                && Objects.equals(stepNo, that.stepNo)
                && Objects.equals(sortOrder, that.sortOrder);
    }
    @Override public int hashCode() { return Objects.hash(processId, stepNo, sortOrder); }
}
