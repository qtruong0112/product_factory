package com.f88.productfactory.ontology;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LifecycleStateRepository extends JpaRepository<LifecycleState, LifecycleStateId> {

    /** Đếm số state của một Lifecycle — cho cột "SỐ STATE" ở màn Lifecycle. */
    long countByLifecycleCode(String lifecycleCode);
}
