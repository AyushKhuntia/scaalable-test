package com.scaalable.crm.repository;

import com.scaalable.crm.entity.CallLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface CallLogRepository extends JpaRepository<CallLog, Long> {
    Optional<CallLog> findByProviderCallId(String providerCallId);
    List<CallLog> findByLead_LeadIdOrderByStartTimeDesc(Long leadId);
    List<CallLog> findByUser_UserIdOrderByStartTimeDesc(Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE CallLog c SET c.recordingUrl = :url, c.durationSeconds = CASE WHEN c.durationSeconds IS NULL OR c.durationSeconds = 0 THEN :duration ELSE c.durationSeconds END WHERE c.callId = :id")
    int updateRecordingInfo(@Param("id") Long id, @Param("url") String url, @Param("duration") Integer duration);

    @Modifying
    @Transactional
    @Query("UPDATE CallLog c SET c.callStatus = :status, c.endTime = CURRENT_TIMESTAMP, c.durationSeconds = CASE WHEN c.durationSeconds IS NULL OR c.durationSeconds = 0 THEN :duration ELSE c.durationSeconds END WHERE c.callId = :id")
    int updateHangupInfo(@Param("id") Long id, @Param("status") String status, @Param("duration") Integer duration);
}
