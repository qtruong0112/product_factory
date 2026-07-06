package com.f88.productfactory.domain.model.ontology;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "obligation_type_composition")
@IdClass(ObligationTypeCompositionId.class)
public class ObligationTypeComposition {

    @Id
    @Column(name = "obligation_type_code", length = 60, nullable = false)
    private String obligationTypeCode;

    @Id
    @Column(name = "element_type_code", length = 30, nullable = false)
    private String elementTypeCode;

    @Column(name = "element_code", length = 60, nullable = false)
    private String elementCode;

    public String getObligationTypeCode() { return obligationTypeCode; }
    public String getElementTypeCode() { return elementTypeCode; }
    public String getElementCode() { return elementCode; }
}
