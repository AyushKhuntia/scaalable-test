package com.scaalable.crm.repository;

import com.scaalable.crm.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByStatus(Lead.LeadStatus status);
    List<Lead> findByCreatedBy_UserId(Long userId);
    boolean existsByPhone(String phone);

    @Query("SELECT l FROM Lead l WHERE " +
           "(:search IS NULL OR LOWER(l.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(l.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(l.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(l.company) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR l.status = :status) AND " +
           "(:unassigned = false OR NOT EXISTS (SELECT a FROM com.scaalable.crm.entity.LeadAssignment a WHERE a.lead = l AND a.unassignedAt IS NULL)) AND " +
           "(:agentId IS NULL OR EXISTS (SELECT a FROM com.scaalable.crm.entity.LeadAssignment a WHERE a.lead = l AND a.unassignedAt IS NULL AND a.assignedTo.userId = :agentId))")
    Page<Lead> searchLeads(@Param("search") String search, 
                           @Param("status") Lead.LeadStatus status,
                           @Param("unassigned") boolean unassigned,
                           @Param("agentId") Long agentId,
                           Pageable pageable);
}
