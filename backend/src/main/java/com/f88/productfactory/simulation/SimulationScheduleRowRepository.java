package com.f88.productfactory.simulation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SimulationScheduleRowRepository extends JpaRepository<SimulationScheduleRow, SimulationScheduleRowId> {

    /** Lịch trả nợ của 1 kịch bản, theo đúng thứ tự kỳ. */
    List<SimulationScheduleRow> findByScenarioIdOrderByPeriodNo(Long scenarioId);
}
