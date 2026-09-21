package com.scaalable.crm.dto;

import jakarta.validation.constraints.NotNull;

/** Payload to save the outcome of a finished call. */
public class CallOutcomeRequest {

    @NotNull(message = "callId is required")
    private Long callId;

    private Long dispositionId;

    private String notes;

    public Long getCallId() { return callId; }
    public void setCallId(Long callId) { this.callId = callId; }

    public Long getDispositionId() { return dispositionId; }
    public void setDispositionId(Long dispositionId) { this.dispositionId = dispositionId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
