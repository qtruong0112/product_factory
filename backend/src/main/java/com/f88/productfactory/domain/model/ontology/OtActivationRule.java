package com.f88.productfactory.domain.model.ontology;

import jakarta.persistence.*;

@Entity
@Table(name = "ot_activation_rule")
@IdClass(OtActivationRuleId.class)
public class OtActivationRule {

    @Id
    @Column(name = "trigger_element_code", length = 60, nullable = false)
    private String triggerElementCode;

    @Id
    @Column(name = "activated_ot_core_code", length = 30, nullable = false)
    private String activatedOtCoreCode;

    public String getTriggerElementCode() { return triggerElementCode; }
    public String getActivatedOtCoreCode() { return activatedOtCoreCode; }
}
