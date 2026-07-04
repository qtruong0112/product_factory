package com.f88.productfactory.ontology;

import jakarta.persistence.*;

@Entity
@Table(name = "financial_obligation_archetype")
public class FinancialObligationArchetype {

    @Id
    @Column(name = "code", length = 30, nullable = false)
    private String code;

    @Column(name = "name", length = 80, nullable = false)
    private String name;

    @Column(name = "nature", length = 160)
    private String nature;

    @Column(name = "nature_desc")
    private String natureDesc;

    @Column(name = "value_structure", length = 160)
    private String valueStructure;

    @Column(name = "value_desc")
    private String valueDesc;

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getNature() { return nature; }
    public String getNatureDesc() { return natureDesc; }
    public String getValueStructure() { return valueStructure; }
    public String getValueDesc() { return valueDesc; }
}
