package com.scaalable.crm.repository;

import com.scaalable.crm.entity.FollowUp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {
    List<FollowUp> findByUser_UserIdAndStatusOrderByFollowUpDateAsc(Long userId, FollowUp.Status status);
    List<FollowUp> findByLead_LeadIdOrderByFollowUpDateDesc(Long leadId);
}
