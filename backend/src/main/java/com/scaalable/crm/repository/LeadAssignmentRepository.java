package com.scaalable.crm.repository;

import com.scaalable.crm.entity.LeadAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LeadAssignmentRepository extends JpaRepository<LeadAssignment, Long> {

    /** The single active assignment for a lead (unassigned_at IS NULL). */
    Optional<LeadAssignment> findByLead_LeadIdAndUnassignedAtIsNull(Long leadId);

    /** All leads currently assigned to an agent. */
    List<LeadAssignment> findByAssignedTo_UserIdAndUnassignedAtIsNull(Long userId);

    /** Assignment history for one lead. */
    List<LeadAssignment> findByLead_LeadIdOrderByAssignedAtDesc(Long leadId);

    /** All currently active assignments across all leads. */
    List<LeadAssignment> findByUnassignedAtIsNull();
}
