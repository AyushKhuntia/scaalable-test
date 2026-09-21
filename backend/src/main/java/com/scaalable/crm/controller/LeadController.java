package com.scaalable.crm.controller;

import com.scaalable.crm.entity.Lead;
import com.scaalable.crm.repository.LeadRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

    private final LeadRepository leadRepository;
    private final com.scaalable.crm.repository.LeadAssignmentRepository assignmentRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final com.scaalable.crm.security.JwtTokenProvider tokenProvider;
    private final com.scaalable.crm.repository.UserRepository userRepository;

    public LeadController(LeadRepository leadRepository,
                          com.scaalable.crm.repository.LeadAssignmentRepository assignmentRepository,
                          org.springframework.jdbc.core.JdbcTemplate jdbcTemplate,
                          com.scaalable.crm.security.JwtTokenProvider tokenProvider,
                          com.scaalable.crm.repository.UserRepository userRepository) {
        this.leadRepository = leadRepository;
        this.assignmentRepository = assignmentRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    @GetMapping
    public org.springframework.data.domain.Page<Lead> getAll(
                             @RequestParam(required = false, defaultValue = "0") int page,
                             @RequestParam(required = false, defaultValue = "10") int size,
                             @RequestParam(required = false) String search,
                             @RequestParam(required = false) String status,
                             @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Lead.LeadStatus statusEnum = null;
        boolean unassigned = false;
        
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            if (status.equalsIgnoreCase("UNASSIGNED")) {
                unassigned = true;
            } else {
                try {
                    statusEnum = Lead.LeadStatus.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException ignored) {}
            }
        }
        
        Long agentId = null;
        com.scaalable.crm.entity.User user = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            Long userId = tokenProvider.getUserIdFromToken(token);
            if (userId != null) {
                user = userRepository.findById(userId).orElse(null);
                if (user != null && user.getRole() == com.scaalable.crm.entity.Role.AGENT) {
                    agentId = user.getUserId();
                }
            }
        }

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        org.springframework.data.domain.Page<Lead> pagedLeads = leadRepository.searchLeads(
                (search != null && !search.isBlank()) ? search : null, 
                statusEnum, 
                unassigned, 
                agentId, 
                pageable);
        
        // Populate assigned agent info for only the current page of leads
        List<Long> leadIds = pagedLeads.getContent().stream().map(Lead::getLeadId).collect(java.util.stream.Collectors.toList());
        if (!leadIds.isEmpty()) {
            List<com.scaalable.crm.entity.LeadAssignment> activeAssignments = assignmentRepository.findByUnassignedAtIsNull();
            Map<Long, com.scaalable.crm.entity.LeadAssignment> assignmentMap = activeAssignments.stream()
                    .filter(a -> leadIds.contains(a.getLead().getLeadId()))
                    .collect(java.util.stream.Collectors.toMap(a -> a.getLead().getLeadId(), a -> a));
            
            for (Lead lead : pagedLeads.getContent()) {
                com.scaalable.crm.entity.LeadAssignment assignment = assignmentMap.get(lead.getLeadId());
                if (assignment != null) {
                    lead.setAssignedAgentId(assignment.getAssignedTo().getUserId());
                    lead.setAssignedAgentName(assignment.getAssignedTo().getFullName());
                }
            }
        }
        
        return pagedLeads;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Lead> getById(@PathVariable Long id) {
        return leadRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Lead lead) {
        if (lead.getPhone() == null || lead.getPhone().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phone is required"));
        }
        return ResponseEntity.ok(leadRepository.save(lead));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Lead updated) {
        return leadRepository.findById(id)
                .map(lead -> {
                    if (updated.getFirstName() != null) lead.setFirstName(updated.getFirstName());
                    if (updated.getLastName() != null) lead.setLastName(updated.getLastName());
                    if (updated.getPhone() != null) lead.setPhone(updated.getPhone());
                    if (updated.getAltPhone() != null) lead.setAltPhone(updated.getAltPhone());
                    if (updated.getEmail() != null) lead.setEmail(updated.getEmail());
                    if (updated.getCompany() != null) lead.setCompany(updated.getCompany());
                    if (updated.getCity() != null) lead.setCity(updated.getCity());
                    if (updated.getState() != null) lead.setState(updated.getState());
                    if (updated.getNotes() != null) lead.setNotes(updated.getNotes());
                    if (updated.getStatus() != null) lead.setStatus(updated.getStatus());
                    
                    if (updated.getAddress() != null) lead.setAddress(updated.getAddress());
                    if (updated.getMapUrl() != null) lead.setMapUrl(updated.getMapUrl());
                    if (updated.getRating() != null) lead.setRating(updated.getRating());
                    if (updated.getCategory() != null) lead.setCategory(updated.getCategory());
                    if (updated.getOpenHours() != null) lead.setOpenHours(updated.getOpenHours());
                    if (updated.getWebsite() != null) lead.setWebsite(updated.getWebsite());
                    if (updated.getFacebook() != null) lead.setFacebook(updated.getFacebook());
                    if (updated.getInstagram() != null) lead.setInstagram(updated.getInstagram());
                    if (updated.getTwitter() != null) lead.setTwitter(updated.getTwitter());

                    return ResponseEntity.ok(leadRepository.save(lead));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/bulk-delete")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> bulkDelete(@RequestBody Map<String, List<Long>> payload) {
        List<Long> ids = payload.get("leadIds");
        if (ids != null && !ids.isEmpty()) {
            for (Long id : ids) {
                jdbcTemplate.update("DELETE FROM follow_ups WHERE lead_id = ?", id);
                jdbcTemplate.update("DELETE FROM call_logs WHERE lead_id = ?", id);
                jdbcTemplate.update("DELETE FROM lead_assignments WHERE lead_id = ?", id);
            }
            leadRepository.deleteAllById(ids);
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (leadRepository.existsById(id)) {
            jdbcTemplate.update("DELETE FROM follow_ups WHERE lead_id = ?", id);
            jdbcTemplate.update("DELETE FROM call_logs WHERE lead_id = ?", id);
            jdbcTemplate.update("DELETE FROM lead_assignments WHERE lead_id = ?", id);
            leadRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
