package com.f88.productfactory.infrastructure.persistence.structure;

import com.f88.productfactory.domain.model.structure.Block;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BlockRepository extends JpaRepository<Block, String> {

    /** Block nào được chi phối bởi 1 Obligation Element cụ thể — cho màn OTF detail (Giai đoạn 53b). */
    List<Block> findByGovernedByElementCode(String governedByElementCode);
}
