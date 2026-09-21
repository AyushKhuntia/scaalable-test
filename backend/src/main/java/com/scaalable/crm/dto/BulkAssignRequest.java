package com.scaalable.crm.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class BulkAssignRequest {

    @NotEmpty(message = "At least one lead ID must be provided")
    private List<Long> leadIds;

    private Long assignedTo; // used for bulk assign to single agent

    private List<Long> agentIds; // used for round-robin assignment

    public List<Long> getLeadIds() { return leadIds; }
    public void setLeadIds(List<Long> leadIds) { this.leadIds = leadIds; }

    public Long getAssignedTo() { return assignedTo; }
    public void setAssignedTo(Long assignedTo) { this.assignedTo = assignedTo; }

    public List<Long> getAgentIds() { return agentIds; }
    public void setAgentIds(List<Long> agentIds) { this.agentIds = agentIds; }
}
