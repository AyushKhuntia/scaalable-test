package com.scaalable.crm.dto;

import jakarta.validation.constraints.NotNull;

/** Payload to assign / re-assign a lead to an agent. */
public class AssignLeadRequest {

    @NotNull(message = "leadId is required")
    private Long leadId;

    @NotNull(message = "assignedTo (user id) is required")
    private Long assignedTo;

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public Long getAssignedTo() { return assignedTo; }
    public void setAssignedTo(Long assignedTo) { this.assignedTo = assignedTo; }
}
