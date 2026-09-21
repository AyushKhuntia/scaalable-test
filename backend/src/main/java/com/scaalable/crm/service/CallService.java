package com.scaalable.crm.service;

import com.scaalable.crm.config.PlivoConfig;
import com.scaalable.crm.dto.CallOutcomeRequest;
import com.scaalable.crm.dto.CallRequest;
import com.scaalable.crm.entity.CallLog;
import com.scaalable.crm.entity.Disposition;
import com.scaalable.crm.entity.Lead;
import com.scaalable.crm.entity.User;
import com.scaalable.crm.repository.CallLogRepository;
import com.scaalable.crm.repository.DispositionRepository;
import com.scaalable.crm.repository.LeadRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.plivo.api.Plivo;
import com.plivo.api.models.call.Call;
import com.plivo.api.models.call.CallCreateResponse;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CallService {

    private final CallLogRepository callLogRepository;
    private final LeadRepository leadRepository;
    private final DispositionRepository dispositionRepository;
    private final PlivoConfig plivoConfig;

    /** Public base URL of this backend as reachable by Plivo's webhooks
     *  (e.g. https://scaalable.example.com). Empty in local dev. */
    @Value("${plivo.callback-base-url:}")
    private String callbackBaseUrl;

    public CallService(CallLogRepository callLogRepository,
                       LeadRepository leadRepository,
                       DispositionRepository dispositionRepository,
                       PlivoConfig plivoConfig) {
        this.callLogRepository = callLogRepository;
        this.leadRepository = leadRepository;
        this.dispositionRepository = dispositionRepository;
        this.plivoConfig = plivoConfig;
    }

    /**
     * Initiate an outbound call via Plivo.
     * Plivo calls the lead's phone directly from the Plivo number.
     * When the lead answers, Plivo fetches the answer_url which returns
     * Plivo XML instructions (Speak + Dial to bridge).
     * If Plivo credentials are not configured the call is logged in
     * DRY-RUN mode so the whole flow stays testable.
     */
    @Transactional
    public Map<String, Object> placeCall(CallRequest request, User agent) {
        Lead lead = leadRepository.findById(request.getLeadId())
                .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + request.getLeadId()));

        CallLog call = new CallLog();
        call.setLead(lead);
        call.setUser(agent);
        call.setDirection(CallLog.Direction.OUTBOUND);
        call.setFromNumber(plivoConfig.getPhoneNumber());
        call.setToNumber(request.getTo());
        call.setStartTime(LocalDateTime.now());
        call.setCallStatus("INITIATED");

        String requestUuid = null;

        // Validate the lead phone number in E.164 format.
        String leadPhone = request.getTo().trim();

        String e164 = "^\\+[1-9]\\d{7,14}$";
        if (!leadPhone.matches(e164)) {
            throw new IllegalArgumentException(
                    "Lead phone '" + leadPhone + "' is not in E.164 format (e.g. +919876543210).");
        }

        String agentPhone = request.getAgentPhone();
        if (agentPhone == null || agentPhone.isBlank()) {
            agentPhone = agent.getPhone();
        }
        if (agentPhone == null || agentPhone.isBlank()) {
            throw new IllegalArgumentException("Agent phone number is missing. Please provide it in the dialer or update your profile.");
        }
        agentPhone = agentPhone.trim();
        if (!agentPhone.matches(e164)) {
            throw new IllegalArgumentException("Agent phone '" + agentPhone + "' is not in E.164 format.");
        }

        if (plivoConfig.isConfigured()) {
            try {
                // 2-Legged Dialing:
                // Plivo calls the AGENT directly. When the agent answers, Plivo fetches
                // the answer_url which returns XML to dial the LEAD and bridge them.

                String answerUrl;
                String hangupUrl = null;

                if (callbackBaseUrl != null && !callbackBaseUrl.isBlank()) {
                    answerUrl = callbackBaseUrl + "/api/plivo/answer?leadPhone="
                            + java.net.URLEncoder.encode(leadPhone, "UTF-8");
                    hangupUrl = callbackBaseUrl + "/api/plivo/hangup";
                } else {
                    // Without a public callback URL, use a simple Plivo XML that
                    // speaks a message. The call won't bridge but will still go through.
                    answerUrl = "https://s3.amazonaws.com/plivosamplexml/speak.xml";
                }

                System.out.println(">>> DIALER DEBUG: from=" + plivoConfig.getPhoneNumber()
                        + " toAgent=" + agentPhone + " toLead=" + leadPhone + " answerUrl=" + answerUrl);

                // Re-init to make sure credentials are set for this call
                Plivo.init(plivoConfig.getAuthId(), plivoConfig.getAuthToken());

                // Build the call creator - we call the AGENT first
                var creator = Call.creator(
                        plivoConfig.getPhoneNumber(),
                        java.util.Collections.singletonList(agentPhone),
                        answerUrl
                ).answerMethod("GET");

                if (hangupUrl != null) {
                    creator.hangupUrl(hangupUrl).hangupMethod("POST");
                }

                CallCreateResponse response = creator.create();
                requestUuid = response.getRequestUuid();

                call.setProviderCallId(requestUuid);
                call.setCallStatus("INITIATED");
                System.out.println(">>> DIALER SUCCESS: requestUuid=" + requestUuid);
            } catch (Exception e) {
                System.out.println(">>> DIALER ERROR: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Plivo call failed: " + e.getMessage(), e);
            }
        } else {
            requestUuid = "DRY-RUN-" + System.currentTimeMillis();
            call.setProviderCallId(requestUuid);
            call.setCallStatus("DRY_RUN");
        }

        call = callLogRepository.save(call);

        // mark the lead contacted
        if (lead.getStatus() == Lead.LeadStatus.NEW || lead.getStatus() == Lead.LeadStatus.ASSIGNED) {
            lead.setStatus(Lead.LeadStatus.CONTACTED);
            leadRepository.save(lead);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("callId", call.getCallId());
        result.put("providerCallId", requestUuid);
        result.put("status", call.getCallStatus());
        result.put("dryRun", !plivoConfig.isConfigured());
        return result;
    }

    /** Save the outcome (disposition + notes) of a call. */
    @Transactional
    public CallLog saveOutcome(CallOutcomeRequest request) {
        CallLog call = callLogRepository.findById(request.getCallId())
                .orElseThrow(() -> new IllegalArgumentException("Call not found: " + request.getCallId()));

        if (request.getDispositionId() != null) {
            Disposition d = dispositionRepository.findById(request.getDispositionId())
                    .orElseThrow(() -> new IllegalArgumentException("Disposition not found: " + request.getDispositionId()));
            call.setDisposition(d);

            // sync lead status with the disposition
            Lead lead = call.getLead();
            switch (d.getDispositionName()) {
                case "CONVERTED"      -> lead.setStatus(Lead.LeadStatus.CONVERTED);
                case "NOT_INTERESTED" -> lead.setStatus(Lead.LeadStatus.NOT_INTERESTED);
                case "CALLBACK", "NO_ANSWER", "BUSY", "VOICEMAIL" -> lead.setStatus(Lead.LeadStatus.FOLLOW_UP);
                default -> lead.setStatus(Lead.LeadStatus.CONTACTED);
            }
            leadRepository.save(lead);
        }

        call.setNotes(request.getNotes());
        return callLogRepository.save(call);
    }

    public List<CallLog> callsForLead(Long leadId) {
        return callLogRepository.findByLead_LeadIdOrderByStartTimeDesc(leadId);
    }

    public List<CallLog> callsByUser(Long userId) {
        return callLogRepository.findByUser_UserIdOrderByStartTimeDesc(userId);
    }
}
