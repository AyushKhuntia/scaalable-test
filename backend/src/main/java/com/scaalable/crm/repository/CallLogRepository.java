package com.scaalable.crm.repository;

import com.scaalable.crm.entity.CallLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CallLogRepository extends JpaRepository<CallLog, Long> {
    Optional<CallLog> findByProviderCallId(String providerCallId);
    List<CallLog> findByLead_LeadIdOrderByStartTimeDesc(Long leadId);
    List<CallLog> findByUser_UserIdOrderByStartTimeDesc(Long userId);
}
