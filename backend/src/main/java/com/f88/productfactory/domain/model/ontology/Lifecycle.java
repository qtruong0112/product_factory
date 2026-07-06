package com.f88.productfactory.domain.model.ontology;

import jakarta.persistence.*;

@Entity
@Table(name = "lifecycle")
public class Lifecycle {

    @Id
    @Column(name = "code", length = 40, nullable = false)
    private String code;

    @Column(name = "name", length = 160, nullable = false)
    private String name;

    @Column(name = "governs", length = 80, nullable = false)
    private String governs;

    @Column(name = "status", length = 12, nullable = false)
    private String status;

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getGoverns() { return governs; }
    public String getStatus() { return status; }
}
