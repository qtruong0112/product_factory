package com.f88.productfactory.release;

import java.io.Serializable;
import java.util.Objects;

/** Khóa ghép process_step (process_id, step_no). */
public class ProcessStepId implements Serializable {
    private Long processId;
    private Short stepNo;

    public ProcessStepId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProcessStepId that)) return false;
        return Objects.equals(processId, that.processId) && Objects.equals(stepNo, that.stepNo);
    }
    @Override public int hashCode() { return Objects.hash(processId, stepNo); }
}
