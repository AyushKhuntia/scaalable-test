package com.scaalable.crm.repository;

import com.scaalable.crm.entity.Disposition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DispositionRepository extends JpaRepository<Disposition, Long> {
    Optional<Disposition> findByDispositionName(String dispositionName);
}
