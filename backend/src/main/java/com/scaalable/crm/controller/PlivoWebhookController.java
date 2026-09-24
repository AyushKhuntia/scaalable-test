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
            String baseUrl = (callbackBaseUrl != null && !callbackBaseUrl.isBlank()
                    ? callbackBaseUrl : "");
            
            // Plivo sends the RecordUrl asynchronously to this callbackUrl when the recording is ready
            String recordingCbUrl = baseUrl + "/api/plivo/recording";

            // By default <Record> has a maxLength of 60 seconds! 
            // We set it to 7200 (2 hours) to record the whole call.
            xml.append("<Record recordSession=\"true\"");
            xml.append(" maxLength=\"7200\"");
            xml.append(" callbackUrl=\"").append(recordingCbUrl).append("\"");
            xml.append(" callbackMethod=\"POST\"");
            xml.append(" redirect=\"false\" />");

            xml.append("<Dial callerId=\"").append(plivoConfig.getPhoneNumber()).append("\">");
            xml.append("<Number>").append(leadPhone).append("</Number>");
            xml.append("</Dial>");
        }

        xml.append("</Response>");

        log.info("Plivo answer XML: {}", xml.toString());
        return ResponseEntity.ok(xml.toString());
    }

    /**
     * GET/POST /api/plivo/recording — Plivo sends this ASYNCHRONOUSLY after the
     * recording file has been processed and is ready for download.
     * Contains: RecordUrl, RecordingDuration, RecordingDurationMs, RecordingID, CallUUID.
     */
    @RequestMapping(value = "/recording", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, String>> recording(
            @RequestParam Map<String, String> allParams) {

        log.info("Plivo recording callback — all params: {}", allParams);

        String recordUrl = allParams.get("RecordUrl");
        String callUuid = allParams.get("CallUUID");
        String recordingDuration = allParams.get("RecordingDuration");

        if (recordUrl == null || recordUrl.isBlank()) {
            log.info("Recording callback: no RecordUrl yet (event={}), ignoring",
                    allParams.getOrDefault("Event", "unknown"));
            return ResponseEntity.ok(Map.of("status", "ignored_no_record_url"));
        }

        Integer durationSec = null;
        if (recordingDuration != null && !recordingDuration.isBlank()) {
            try {
                durationSec = (int) Double.parseDouble(recordingDuration);
            } catch (NumberFormatException e) {
                log.warn("Could not parse RecordingDuration: {}", recordingDuration);
            }
        }

        // Find the call log by CallUUID
        int updated = 0;
        try {
            if (callUuid != null) {
                com.scaalable.crm.entity.CallLog call = callLogRepository.findByProviderCallId(callUuid).orElse(null);
                
                if (call == null) {
                    log.warn("findByProviderCallId returned empty for {}", callUuid);
                    call = callLogRepository.findAll().stream()
                            .filter(c -> c.getRecordingUrl() == null)
                            .filter(c -> c.getProviderCallId() != null)
                            .sorted((a, b) -> b.getStartTime().compareTo(a.getStartTime()))
                            .findFirst().orElse(null);
                }

                if (call != null) {
                    updated = callLogRepository.updateRecordingInfo(call.getCallId(), recordUrl, durationSec);
                    log.info("Updated call #{} with recording: url={} duration={}s",
                            call.getCallId(), recordUrl, durationSec);
                } else {
                    log.warn("CallLog completely not found for callUuid={}", callUuid);
                }
            } else {
                log.warn("callUuid is null in recording callback");
            }
        } catch (Exception e) {
            log.error("Exception while updating call log in recording callback: ", e);
        }

        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "callUuid", callUuid != null ? callUuid : "",
                "recordUrl", recordUrl,
                "callLogUpdated", String.valueOf(updated)));
    }

    /**
     * GET/POST /api/plivo/dial-callback — Plivo posts this when the Dial action completes
     * (i.e. the dialed party hangs up). Contains RecordUrl, DialBLegDuration, etc.
     */
    @RequestMapping(value = "/dial-callback", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, String>> dialCallback(
            @RequestParam Map<String, String> allParams) {

        log.info("Plivo dial-callback — all params: {}", allParams);

        String recordUrl = allParams.get("RecordUrl");
        String callUuid = allParams.get("CallUUID");
        String dialBLegDuration = allParams.get("DialBLegDuration");
        String dialALegUuid = allParams.get("DialALegUUID");
        String event = allParams.get("Event");

        String lookupUuid = dialALegUuid != null ? dialALegUuid : callUuid;

        int updated = 0;
        if (lookupUuid != null) {
            final String finalRecordUrl = recordUrl;
            Integer durationSec = null;
            if (dialBLegDuration != null && !dialBLegDuration.isBlank()) {
                try {
                    durationSec = (int) Double.parseDouble(dialBLegDuration);
                } catch (NumberFormatException ignored) {}
            }
            final Integer finalDuration = durationSec;

            updated = callLogRepository.findByProviderCallId(lookupUuid)
                    .or(() -> callLogRepository.findAll().stream()
                            .filter(c -> c.getProviderCallId() != null)
                            .sorted((a, b) -> b.getStartTime().compareTo(a.getStartTime()))
                            .findFirst())
                    .map(call -> {
                        if (finalRecordUrl != null && !finalRecordUrl.isBlank()) {
                            call.setRecordingUrl(finalRecordUrl);
                        }
                        if (finalDuration != null && finalDuration > 0) {
                            call.setDurationSeconds(finalDuration);
                        }
                        callLogRepository.save(call);
                        log.info("Dial-callback updated call #{}: recordUrl={} duration={}s",
                                call.getCallId(), finalRecordUrl, finalDuration);
                        return 1;
                    })
                    .orElse(0);
        }

        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "callUuid", callUuid != null ? callUuid : "",
                "callLogUpdated", String.valueOf(updated)));
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
            @RequestParam(value = "BillDuration", required = false) Integer billDuration,
            @RequestParam(value = "HangupCause", required = false) String hangupCause,
            @RequestParam(value = "RecordUrl", required = false) String recordUrl) {

        log.info("Plivo hangup webhook: callUuid={} requestUuid={} status={} duration={} billDuration={} cause={}",
                callUuid, requestUuid, callStatus, duration, billDuration, hangupCause);

        // Try to find the call log by the request UUID (stored as providerCallId)
        String lookupId = requestUuid != null ? requestUuid : callUuid;
        int updated = 0;

        if (lookupId != null) {
            com.scaalable.crm.entity.CallLog call = callLogRepository.findByProviderCallId(lookupId).orElse(null);
            if (call != null) {
                Integer finalDuration = null;
                if (billDuration != null && billDuration > 0) {
                    finalDuration = billDuration;
                } else if (duration != null && duration > 0) {
                    finalDuration = duration;
                }
                
                updated = callLogRepository.updateHangupInfo(call.getCallId(), callStatus, finalDuration);
                
                // If recordUrl is also provided in the hangup webhook (for short calls), save it atomically too
                if (recordUrl != null && !recordUrl.isBlank()) {
                    callLogRepository.updateRecordingInfo(call.getCallId(), recordUrl, finalDuration);
                }
            }
        }

        return ResponseEntity.ok(Map.of(
                "callUuid", callUuid != null ? callUuid : "",
                "status", callStatus != null ? callStatus : "",
                "callLogUpdated", String.valueOf(updated)));
    }
}
