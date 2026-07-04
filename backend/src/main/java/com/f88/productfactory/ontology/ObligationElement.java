package com.f88.productfactory.ontology;

import jakarta.persistence.*;

@Entity
@Table(name = "obligation_element")
public class ObligationElement {

    @Id
    @Column(name = "code", length = 60, nullable = false)
    private String code;

    @Column(name = "name", length = 160, nullable = false)
    private String name;

    @Column(name = "element_type_code", length = 30, nullable = false)
    private String elementTypeCode;

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getElementTypeCode() { return elementTypeCode; }
}
