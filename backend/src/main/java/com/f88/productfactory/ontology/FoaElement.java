package com.f88.productfactory.ontology;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "foa_element")
@IdClass(FoaElementId.class)
public class FoaElement {

    @Id
    @Column(name = "archetype_code", length = 30, nullable = false)
    private String archetypeCode;

    @Id
    @Column(name = "element_code", length = 60, nullable = false)
    private String elementCode;

    @Column(name = "requirement", length = 10, nullable = false)
    private String requirement;

    public String getArchetypeCode() { return archetypeCode; }
    public String getElementCode() { return elementCode; }
    public String getRequirement() { return requirement; }
}
