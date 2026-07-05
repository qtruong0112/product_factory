package com.f88.productfactory.simulation;

import java.io.Serializable;
import java.util.Objects;

/** Khóa ghép simulation_schedule_row (scenario_id, period_no). */
public class SimulationScheduleRowId implements Serializable {
    private Long scenarioId;
    private Short periodNo;

    public SimulationScheduleRowId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SimulationScheduleRowId that)) return false;
        return Objects.equals(scenarioId, that.scenarioId) && Objects.equals(periodNo, that.periodNo);
    }
    @Override public int hashCode() { return Objects.hash(scenarioId, periodNo); }
}
