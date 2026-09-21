package com.scaalable.crm.controller;

import com.scaalable.crm.dto.CallOutcomeRequest;
import com.scaalable.crm.dto.CallRequest;
import com.scaalable.crm.entity.CallLog;
import com.scaalable.crm.repository.DispositionRepository;
import com.scaalable.crm.repository.UserRepository;
import com.scaalable.crm.security.JwtTokenProvider;
import com.scaalable.crm.service.CallService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calls")
public class CallController {

    private final CallService callService;
    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;
    private final DispositionRepository dispositionRepository;

    public CallController(CallService callService,
                          UserRepository userRepository,
                          JwtTokenProvider tokenProvider,
                          DispositionRepository dispositionRepository) {
        this.callService = callService;
        this.userRepository = userRepository;
        this.tokenProvider = tokenProvider;
        this.dispositionRepository = dispositionRepository;
    }

    /** Place an outbound call through Plivo (agent's own queue). */
    @PostMapping("/dial")
    public ResponseEntity<?> dial(@Valid @RequestBody CallRequest request,
                                  @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            var agent = userRepository.findByUsername(tokenProvider.getUsernameFromToken(token))
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return ResponseEntity.ok(callService.placeCall(request, agent));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /** Save disposition + notes after a call. */
    @PostMapping("/outcome")
    public ResponseEntity<?> outcome(@Valid @RequestBody CallOutcomeRequest request) {
        try {
            return ResponseEntity.ok(callService.saveOutcome(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/lead/{leadId}")
    public List<CallLog> callsForLead(@PathVariable Long leadId) {
        return callService.callsForLead(leadId);
    }

    @GetMapping("/my")
    public ResponseEntity<?> myCalls(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userId = tokenProvider.getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }
        return ResponseEntity.ok(callService.callsByUser(userId));
    }

    /** Reference list of dispositions for the outcome dropdown. */
    @GetMapping("/dispositions")
    public List<Map<String, Object>> dispositions() {
        return dispositionRepository.findAll().stream()
                .map(d -> Map.<String, Object>of(
                        "dispositionId", d.getDispositionId(),
                        "name", d.getDispositionName(),
                        "description", d.getDescription() == null ? "" : d.getDescription()))
                .toList();
    }
}
