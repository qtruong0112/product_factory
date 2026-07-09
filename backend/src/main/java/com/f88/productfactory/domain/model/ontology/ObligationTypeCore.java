package com.f88.productfactory.domain.model.ontology;

import jakarta.persistence.*;

@Entity
@Table(name = "obligation_type_core")
public class ObligationTypeCore {

    @Id
    @Column(name = "code", length = 30, nullable = false)
    private String code;

    @Column(name = "name", length = 120, nullable = false)
    private String name;

    @Column(name = "group_kind", length = 12, nullable = false)
    private String groupKind;

    @Column(name = "description")
    private String description;

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getGroupKind() { return groupKind; }
    public String getDescription() { return description; }
}
