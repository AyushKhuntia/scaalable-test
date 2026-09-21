package com.scaalable.crm.controller;

import com.scaalable.crm.dto.AssignLeadRequest;
import com.scaalable.crm.entity.LeadAssignment;
import com.scaalable.crm.repository.UserRepository;
import com.scaalable.crm.security.JwtTokenProvider;
import com.scaalable.crm.service.LeadAssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assignments")
public class LeadAssignmentController {

    private final LeadAssignmentService assignmentService;
    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;

    public LeadAssignmentController(LeadAssignmentService assignmentService,
                                    UserRepository userRepository,
                                    JwtTokenProvider tokenProvider) {
        this.assignmentService = assignmentService;
        this.userRepository = userRepository;
        this.tokenProvider = tokenProvider;
    }

    /** ADMIN / MANAGER: assign a lead to an agent. */
    @PostMapping
    public ResponseEntity<?> assign(@Valid @RequestBody AssignLeadRequest request,
                                    @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            var assignedBy = userRepository.findByUsername(tokenProvider.getUsernameFromToken(token))
                    .orElseThrow(() -> new RuntimeException("User not found"));
            LeadAssignment assignment = assignmentService.assign(request, assignedBy);
            return ResponseEntity.ok(Map.of(
                    "assignmentId", assignment.getAssignmentId(),
                    "leadId", assignment.getLead().getLeadId(),
                    "assignedTo", assignment.getAssignedTo().getUserId(),
                    "assignedAt", assignment.getAssignedAt().toString()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/bulk")
    public ResponseEntity<?> bulkAssign(@Valid @RequestBody com.scaalable.crm.dto.BulkAssignRequest request,
                                        @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            var assignedBy = userRepository.findByUsername(tokenProvider.getUsernameFromToken(token))
                    .orElseThrow(() -> new RuntimeException("User not found"));
            assignmentService.bulkAssign(request, assignedBy);
            return ResponseEntity.ok(Map.of("message", "Bulk assignment successful"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/round-robin")
    public ResponseEntity<?> roundRobinAssign(@Valid @RequestBody com.scaalable.crm.dto.BulkAssignRequest request,
                                              @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            var assignedBy = userRepository.findByUsername(tokenProvider.getUsernameFromToken(token))
                    .orElseThrow(() -> new RuntimeException("User not found"));
            assignmentService.roundRobinAssign(request, assignedBy);
            return ResponseEntity.ok(Map.of("message", "Round robin assignment successful"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** AGENT: my current calling queue (active assignments). */
    @GetMapping("/my")
    public ResponseEntity<?> myLeads(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userId = tokenProvider.getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }
        List<LeadAssignment> assignments = assignmentService.myAssignedLeads(userId);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/lead/{leadId}")
    public List<LeadAssignment> historyForLead(@PathVariable Long leadId) {
        return assignmentService.historyForLead(leadId);
    }

    @DeleteMapping("/lead/{leadId}")
    public ResponseEntity<Void> unassign(@PathVariable Long leadId) {
        assignmentService.unassign(leadId);
        return ResponseEntity.noContent().build();
    }
}
