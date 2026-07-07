package com.f88.productfactory.domain.repository.ontology;

import com.f88.productfactory.domain.model.ontology.Lifecycle;
import com.f88.productfactory.domain.model.ontology.LifecycleState;
import com.f88.productfactory.domain.model.ontology.LifecycleStateId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LifecycleStateRepository extends JpaRepository<LifecycleState, LifecycleStateId> {

    /** Đếm số state của một Lifecycle — cho cột "SỐ STATE" ở màn Lifecycle. */
    long countByLifecycleCode(String lifecycleCode);

    /** Danh sách state theo đúng thứ tự — cho stepper ở màn chi tiết Lifecycle. */
    List<LifecycleState> findByLifecycleCodeOrderBySortOrder(String lifecycleCode);
}
