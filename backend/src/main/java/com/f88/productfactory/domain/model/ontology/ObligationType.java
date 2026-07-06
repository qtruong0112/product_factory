package com.f88.productfactory.domain.model.ontology;

import jakarta.persistence.*;

@Entity
@Table(name = "obligation_type")
public class ObligationType {

    @Id
    @Column(name = "code", length = 60, nullable = false)
    private String code;

    @Column(name = "name", length = 160, nullable = false)
    private String name;

    @Column(name = "family_code", length = 30, nullable = false)
    private String familyCode;

    @Column(name = "archetype_code", length = 30, nullable = false)
    private String archetypeCode;

    @Column(name = "status", length = 12, nullable = false)
    private String status;

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getFamilyCode() { return familyCode; }
    public String getArchetypeCode() { return archetypeCode; }
    public String getStatus() { return status; }
}
