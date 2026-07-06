package com.f88.productfactory.domain.model.ontology;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "lifecycle_state")
@IdClass(LifecycleStateId.class)
public class LifecycleState {

    @Id
    @Column(name = "lifecycle_code", length = 40, nullable = false)
    private String lifecycleCode;

    @Id
    @Column(name = "sort_order", nullable = false)
    private Short sortOrder;

    @Column(name = "name", length = 60, nullable = false)
    private String name;

    public String getLifecycleCode() { return lifecycleCode; }
    public Short getSortOrder() { return sortOrder; }
    public String getName() { return name; }
}
