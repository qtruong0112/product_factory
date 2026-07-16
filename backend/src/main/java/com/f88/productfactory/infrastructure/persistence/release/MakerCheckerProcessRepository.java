package com.f88.productfactory.infrastructure.persistence.release;

import com.f88.productfactory.domain.model.release.MakerCheckerProcess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MakerCheckerProcessRepository extends JpaRepository<MakerCheckerProcess, Long> {

    /** Process template chuẩn 8 bước (title/role/input/output/checklist) — dùng chung cho mọi variant. */
    Optional<MakerCheckerProcess> findFirstByOrderById();
}
