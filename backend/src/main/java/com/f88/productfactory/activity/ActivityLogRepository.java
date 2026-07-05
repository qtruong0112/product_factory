package com.f88.productfactory.activity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    /** Nhật ký hoạt động, mới nhất trước. */
    Page<ActivityLog> findAllByOrderByOccurredAtDesc(Pageable pageable);
}
