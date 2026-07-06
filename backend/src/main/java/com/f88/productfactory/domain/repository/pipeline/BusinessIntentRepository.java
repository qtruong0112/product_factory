package com.f88.productfactory.domain.repository.pipeline;

import com.f88.productfactory.domain.model.pipeline.BusinessIntent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessIntentRepository extends JpaRepository<BusinessIntent, Long> {
}
