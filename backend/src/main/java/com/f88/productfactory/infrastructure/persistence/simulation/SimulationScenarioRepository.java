package com.f88.productfactory.infrastructure.persistence.simulation;

import com.f88.productfactory.domain.model.simulation.SimulationScenario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SimulationScenarioRepository extends JpaRepository<SimulationScenario, Long> {
}
