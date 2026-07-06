package com.f88.productfactory.domain.repository.structure;

import com.f88.productfactory.domain.model.attribute.Attribute;
import com.f88.productfactory.domain.model.structure.AnswerSlot;
import com.f88.productfactory.domain.model.structure.AnswerSlotId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnswerSlotRepository extends JpaRepository<AnswerSlot, AnswerSlotId> {

    /** Các slot của một block (giữ thứ tự seed insert). */
    List<AnswerSlot> findByBlockId(String blockId);

    /** Đếm slot của một block — cho cột "ANSWER SLOT" ở màn danh sách. */
    long countByBlockId(String blockId);

    /** Các slot dùng một attribute — cho cột "DÙNG TRONG ANSWER SLOT" ở màn Attribute. */
    List<AnswerSlot> findByAttributeCode(String attributeCode);
}
