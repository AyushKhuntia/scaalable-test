package com.scaalable.crm.service;

import com.scaalable.crm.dto.AssignLeadRequest;
import com.scaalable.crm.entity.Lead;
import com.scaalable.crm.entity.LeadAssignment;
import com.scaalable.crm.entity.User;
import com.scaalable.crm.repository.LeadAssignmentRepository;
import com.scaalable.crm.repository.LeadRepository;
import com.scaalable.crm.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LeadAssignmentService {

    private final LeadAssignmentRepository assignmentRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;

    public LeadAssignmentService(LeadAssignmentRepository assignmentRepository,
                                 LeadRepository leadRepository,
                                 UserRepository userRepository) {
        this.assignmentRepository = assignmentRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
    }

    /**
     * Assign (or re-assign) a lead to an agent.
     * Closes the previous active assignment by stamping unassigned_at,
     * then creates the new assignment row. Keeps full history.
     */
    @Transactional
    public LeadAssignment assign(AssignLeadRequest request, User assignedBy) {
        Lead lead = leadRepository.findById(request.getLeadId())
                .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + request.getLeadId()));
        User agent = userRepository.findById(request.getAssignedTo())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.getAssignedTo()));

        // close current active assignment, if any
        assignmentRepository.findByLead_LeadIdAndUnassignedAtIsNull(lead.getLeadId())
                .ifPresent(current -> {
                    current.setUnassignedAt(LocalDateTime.now());
                    assignmentRepository.save(current);
                });

        LeadAssignment assignment = new LeadAssignment();
        assignment.setLead(lead);
        assignment.setAssignedTo(agent);
        assignment.setAssignedBy(assignedBy);
        assignment.setAssignedAt(LocalDateTime.now());
        assignment = assignmentRepository.save(assignment);

        lead.setStatus(Lead.LeadStatus.ASSIGNED);
        leadRepository.save(lead);

        return assignment;
    }

    @Transactional
    public void bulkAssign(com.scaalable.crm.dto.BulkAssignRequest request, User assignedBy) {
        if (request.getAssignedTo() == null) {
            throw new IllegalArgumentException("Assigned agent ID is required for bulk assignment");
        }
        for (Long leadId : request.getLeadIds()) {
            AssignLeadRequest singleRequest = new AssignLeadRequest();
            singleRequest.setLeadId(leadId);
            singleRequest.setAssignedTo(request.getAssignedTo());
            assign(singleRequest, assignedBy); // reuse existing logic
        }
    }

    @Transactional
    public void roundRobinAssign(com.scaalable.crm.dto.BulkAssignRequest request, User assignedBy) {
        if (request.getAgentIds() == null || request.getAgentIds().isEmpty()) {
            throw new IllegalArgumentException("Agent IDs are required for round robin assignment");
        }
        List<Long> agentIds = request.getAgentIds();
        int agentCount = agentIds.size();
        int currentIndex = 0;
        
        for (Long leadId : request.getLeadIds()) {
            AssignLeadRequest singleRequest = new AssignLeadRequest();
            singleRequest.setLeadId(leadId);
            singleRequest.setAssignedTo(agentIds.get(currentIndex));
            assign(singleRequest, assignedBy);
            
            currentIndex = (currentIndex + 1) % agentCount;
        }
    }

    /** Active leads currently assigned to an agent (their calling queue). */
    public List<LeadAssignment> myAssignedLeads(Long userId) {
        return assignmentRepository.findByAssignedTo_UserIdAndUnassignedAtIsNull(userId);
    }

    /** Assignment history for a lead (newest first). */
    public List<LeadAssignment> historyForLead(Long leadId) {
        return assignmentRepository.findByLead_LeadIdOrderByAssignedAtDesc(leadId);
    }

    /** Remove the active assignment from a lead. */
    @Transactional
    public void unassign(Long leadId) {
        assignmentRepository.findByLead_LeadIdAndUnassignedAtIsNull(leadId)
                .ifPresent(current -> {
                    current.setUnassignedAt(LocalDateTime.now());
                    assignmentRepository.save(current);
                });
    }
}
