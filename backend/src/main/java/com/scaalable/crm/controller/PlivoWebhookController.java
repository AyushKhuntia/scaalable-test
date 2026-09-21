package com.scaalable.crm.controller;

import com.scaalable.crm.entity.CallLog;
import com.scaalable.crm.repository.CallLogRepository;
import com.scaalable.crm.config.PlivoConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;

/**
 * Webhooks Plivo calls back during and after a call, so call_logs always gets
 * the final status and real duration automatically.
 *
 * Configure the callback URLs when creating the call (CallService):
 *   - answer_url:  https://YOUR_HOST/api/plivo/answer?leadPhone=...
 *   - hangup_url:  https://YOUR_HOST/api/plivo/hangup
 *
 * These endpoints skip JWT auth (permitAll in SecurityConfig).
 */
@RestController
@RequestMapping("/api/plivo")
public class PlivoWebhookController {

    private static final Logger log = LoggerFactory.getLogger(PlivoWebhookController.class);

    private final CallLogRepository callLogRepository;
    private final PlivoConfig plivoConfig;

    @Value("${plivo.callback-base-url:}")
    private String callbackBaseUrl;

    public PlivoWebhookController(CallLogRepository callLogRepository, PlivoConfig plivoConfig) {
        this.callLogRepository = callLogRepository;
        this.plivoConfig = plivoConfig;
    }

    /**
     * GET/POST /api/plivo/answer — Plivo fetches this when the call is answered.
     * Returns Plivo XML to speak a greeting and optionally dial a number.
     *
     * Query params from Plivo: From, To, CallUUID, CallStatus, Direction, etc.
     * Custom param: leadPhone (passed when creating the call)
     */
    @RequestMapping(value = "/answer", method = {RequestMethod.GET, RequestMethod.POST},
                    produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> answer(
            @RequestParam(value = "leadPhone", required = false) String leadPhone,
            @RequestParam(value = "CallUUID", required = false) String callUuid) {

        log.info("Plivo answer webhook: callUuid={} leadPhone={}", callUuid, leadPhone);

        // Build Plivo XML response
        StringBuilder xml = new StringBuilder();
        xml.append("<Response>");
        xml.append("<Speak>Connecting you now. Please hold.</Speak>");

        if (leadPhone != null && !leadPhone.isBlank()) {
            String recordAction = (callbackBaseUrl != null ? callbackBaseUrl : "") + "/api/plivo/hangup";
            xml.append("<Record recordSession=\"true\" action=\"").append(recordAction).append("\" method=\"POST\" redirect=\"false\" />");
            xml.append("<Dial callerId=\"").append(plivoConfig.getPhoneNumber()).append("\">");
            xml.append("<Number>").append(leadPhone).append("</Number>");
            xml.append("</Dial>");
        }

        xml.append("</Response>");

        return ResponseEntity.ok(xml.toString());
    }

    /**
     * POST /api/plivo/hangup — Plivo posts this after the call ends.
     * Updates call_logs with final status and duration.
     *
     * Plivo sends: CallUUID, RequestUUID, From, To, CallStatus,
     * Duration, BillDuration, HangupCause, etc.
     */
    @PostMapping("/hangup")
    public ResponseEntity<Map<String, String>> hangup(
            @RequestParam(value = "CallUUID", required = false) String callUuid,
            @RequestParam(value = "RequestUUID", required = false) String requestUuid,
            @RequestParam(value = "CallStatus", required = false) String callStatus,
            @RequestParam(value = "Duration", required = false) Integer duration,
            @RequestParam(value = "HangupCause", required = false) String hangupCause,
            @RequestParam(value = "RecordUrl", required = false) String recordUrl) {

        log.info("Plivo hangup webhook: callUuid={} requestUuid={} status={} duration={} cause={}",
                callUuid, requestUuid, callStatus, duration, hangupCause);

        // Try to find the call log by the request UUID (stored as providerCallId)
        String lookupId = requestUuid != null ? requestUuid : callUuid;
        int updated = 0;

        if (lookupId != null) {
            updated = callLogRepository.findByProviderCallId(lookupId)
                    .map(call -> {
                        if (callStatus != null) {
                            call.setCallStatus(callStatus);
                        }
                        call.setEndTime(LocalDateTime.now());
                        if (duration != null) {
                            call.setDurationSeconds(duration);
                        }
                        if (recordUrl != null) {
                            call.setRecordingUrl(recordUrl);
                        }
                        callLogRepository.save(call);
                        return 1;
                    })
                    .orElse(0);
        }

        return ResponseEntity.ok(Map.of(
                "callUuid", callUuid != null ? callUuid : "",
                "status", callStatus != null ? callStatus : "",
                "callLogUpdated", String.valueOf(updated)));
    }
}
