package com.f88.productfactory.infrastructure.persistence.release;

import com.f88.productfactory.domain.model.release.ProcessStepChecklist;
import com.f88.productfactory.domain.model.release.ProcessStepChecklistId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProcessStepChecklistRepository extends JpaRepository<ProcessStepChecklist, ProcessStepChecklistId> {

    /** Checklist của một bước cụ thể, theo sort_order. */
    List<ProcessStepChecklist> findByProcessIdAndStepNoOrderBySortOrder(Long processId, Short stepNo);
}
