package com.f88.productfactory.pipeline;

import jakarta.persistence.*;

@Entity
@Table(name = "business_intent")
public class BusinessIntent {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "owner", length = 120, nullable = false)
    private String owner;

    @Column(name = "period", length = 60, nullable = false)
    private String period;

    @Column(name = "objective")
    private String objective;

    @Column(name = "status", length = 12, nullable = false)
    private String status;

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getOwner() { return owner; }
    public String getPeriod() { return period; }
    public String getObjective() { return objective; }
    public String getStatus() { return status; }
}
