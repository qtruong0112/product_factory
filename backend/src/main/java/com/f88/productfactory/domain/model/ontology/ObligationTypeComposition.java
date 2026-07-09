package com.f88.productfactory.domain.model.ontology;

import jakarta.persistence.*;

@Entity
@Table(name = "obligation_type_composition")
@IdClass(ObligationTypeCompositionId.class)
public class ObligationTypeComposition {

    @Id
    @Column(name = "obligation_type_code", length = 60, nullable = false)
    private String obligationTypeCode;

    @Id
    @Column(name = "ot_core_code", length = 30, nullable = false)
    private String otCoreCode;

    @Id
    @Column(name = "element_type_code", length = 30, nullable = false)
    private String elementTypeCode;

    @Id
    @Column(name = "leg", length = 20, nullable = false)
    private String leg;

    @Column(name = "element_code", length = 60, nullable = false)
    private String elementCode;

    public String getObligationTypeCode() { return obligationTypeCode; }
    public String getOtCoreCode() { return otCoreCode; }
    public String getElementTypeCode() { return elementTypeCode; }
    public String getLeg() { return leg; }
    public String getElementCode() { return elementCode; }
}
