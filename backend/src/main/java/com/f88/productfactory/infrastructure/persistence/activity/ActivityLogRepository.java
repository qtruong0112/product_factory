package com.f88.productfactory.infrastructure.persistence.activity;

import com.f88.productfactory.domain.model.activity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    /** Nhật ký hoạt động, mới nhất trước. */
    Page<ActivityLog> findAllByOrderByOccurredAtDesc(Pageable pageable);

    /** Nhật ký của riêng 1 entity (vd 1 Product Variant cụ thể) — cho màn chi tiết. */
    List<ActivityLog> findByEntityTypeAndEntityCodeOrderByOccurredAtDesc(String entityType, String entityCode);
}
