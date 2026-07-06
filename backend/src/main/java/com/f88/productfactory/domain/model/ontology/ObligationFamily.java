package com.f88.productfactory.domain.model.ontology;

import jakarta.persistence.*;

@Entity
@Table(name = "obligation_family")
public class ObligationFamily {

    @Id
    @Column(name = "code", length = 30, nullable = false)
    private String code;

    @Column(name = "name", length = 80, nullable = false)
    private String name;

    @Column(name = "identified_by_nature_code", length = 60, nullable = false)
    private String identifiedByNatureCode;

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getIdentifiedByNatureCode() { return identifiedByNatureCode; }
}
