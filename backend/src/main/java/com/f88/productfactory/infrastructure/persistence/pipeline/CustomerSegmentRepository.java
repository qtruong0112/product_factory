package com.f88.productfactory.infrastructure.persistence.pipeline;

import com.f88.productfactory.domain.model.pipeline.CustomerSegment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerSegmentRepository extends JpaRepository<CustomerSegment, String> {
}
