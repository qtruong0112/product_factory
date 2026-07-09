package com.f88.productfactory.domain.model.ontology;

import jakarta.persistence.*;

/**
 * Giai đoạn 51: entity này đại diện khái niệm OTF (Obligation Type Family) trong tài liệu
 * FOA/OET/OE/OT/OTF — tên bảng/class giữ nguyên "ObligationType" để tránh vỡ Pattern/Search/API
 * path đang tham chiếu mã (obligation_type_code không đổi). OT "lõi" thật sự (7 mã cố định) nằm
 * ở {@link ObligationTypeCore}. Không còn familyCode (đã gộp bỏ obligation_family, dùng thẳng
 * archetypeCode).
 */
@Entity
@Table(name = "obligation_type")
public class ObligationType {

    @Id
    @Column(name = "code", length = 60, nullable = false)
    private String code;

    @Column(name = "name", length = 160, nullable = false)
    private String name;

    @Column(name = "archetype_code", length = 30, nullable = false)
    private String archetypeCode;

    @Column(name = "status", length = 12, nullable = false)
    private String status;

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getArchetypeCode() { return archetypeCode; }
    public String getStatus() { return status; }
}
