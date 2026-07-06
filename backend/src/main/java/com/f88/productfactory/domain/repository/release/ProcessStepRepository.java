package com.f88.productfactory.domain.repository.release;

import com.f88.productfactory.domain.model.release.ProcessStep;
import com.f88.productfactory.domain.model.release.ProcessStepId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProcessStepRepository extends JpaRepository<ProcessStep, ProcessStepId> {

    /** 8 bước của một quy trình, theo đúng thứ tự step_no. */
    List<ProcessStep> findByProcessIdOrderByStepNo(Long processId);
}
