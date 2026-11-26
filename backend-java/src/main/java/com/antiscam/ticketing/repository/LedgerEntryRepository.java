package com.antiscam.ticketing.repository;

import com.antiscam.ticketing.entity.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {
    Optional<LedgerEntry> findByIdempotencyKey(String idempotencyKey);
    List<LedgerEntry> findAllByOrderByCreatedAtDesc();
    List<LedgerEntry> findByTransactionId(String transactionId);
}
