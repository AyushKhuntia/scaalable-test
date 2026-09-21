package com.scaalable.crm.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "dispositions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Disposition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "disposition_id")
    private Long dispositionId;

    @Column(name = "disposition_name", nullable = false, unique = true, length = 80)
    private String dispositionName;

    @Column(name = "description", length = 255)
    private String description;

    public Disposition() {}

    public Disposition(String dispositionName, String description) {
        this.dispositionName = dispositionName;
        this.description = description;
    }

    public Long getDispositionId() { return dispositionId; }
    public void setDispositionId(Long dispositionId) { this.dispositionId = dispositionId; }

    public String getDispositionName() { return dispositionName; }
    public void setDispositionName(String dispositionName) { this.dispositionName = dispositionName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
