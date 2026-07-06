package com.f88.productfactory.domain.repository.pipeline;

import com.f88.productfactory.domain.model.pipeline.Fragment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FragmentRepository extends JpaRepository<Fragment, Long> {

    /** Toàn bộ fragment (mọi block/slot/scope) của một config. */
    List<Fragment> findByConfigCode(String configCode);

    /** Đếm fragment của một config — cho cột "FRAGMENT" ở màn danh sách. */
    long countByConfigCode(String configCode);
}
