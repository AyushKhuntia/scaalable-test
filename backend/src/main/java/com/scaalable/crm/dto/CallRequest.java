package com.scaalable.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Payload when an agent places a call to a lead through the dialer. */
public class CallRequest {

    private Long leadId;

    @NotBlank(message = "to (destination number) is required")
    private String to;            // E.164, e.g. +919876543210

    /** Optional override for the agent's own phone (rings first).
     *  Falls back to the logged-in user's phone. E.164 format. */
    private String agentPhone;

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }

    public String getAgentPhone() { return agentPhone; }
    public void setAgentPhone(String agentPhone) { this.agentPhone = agentPhone; }
}
