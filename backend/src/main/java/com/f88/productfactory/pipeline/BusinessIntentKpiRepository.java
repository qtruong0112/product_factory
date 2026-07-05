package com.f88.productfactory.pipeline;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BusinessIntentKpiRepository extends JpaRepository<BusinessIntentKpi, BusinessIntentKpiId> {

    /** KPI của 1 Business Intent, theo đúng sort_order. */
    List<BusinessIntentKpi> findByBusinessIntentIdOrderBySortOrder(Long businessIntentId);
}
