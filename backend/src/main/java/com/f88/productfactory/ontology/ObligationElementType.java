package com.f88.productfactory.ontology;

import jakarta.persistence.*;

@Entity
@Table(name = "obligation_element_type")
public class ObligationElementType {

    @Id
    @Column(name = "code", length = 30, nullable = false)
    private String code;

    @Column(name = "name", length = 80, nullable = false)
    private String name;

    @Column(name = "short_name", length = 40)
    private String shortName;

    @Column(name = "description")
    private String description;

    @Column(name = "is_identify", nullable = false)
    private boolean isIdentify;

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getShortName() { return shortName; }
    public String getDescription() { return description; }
    public boolean isIsIdentify() { return isIdentify; }
}
