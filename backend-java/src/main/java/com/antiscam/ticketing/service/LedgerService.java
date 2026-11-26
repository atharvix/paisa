package com.antiscam.ticketing.service;

import com.antiscam.ticketing.entity.LedgerEntry;
import com.antiscam.ticketing.entity.LedgerEntryType;
import com.antiscam.ticketing.repository.LedgerEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class LedgerService {

    private final LedgerEntryRepository ledgerRepository;

    public LedgerService(LedgerEntryRepository ledgerRepository) {
        this.ledgerRepository = ledgerRepository;
    }

    /**
     * Records an immutable financial ledger entry with unique idempotency guarantee.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public LedgerEntry recordEntry(String transactionId,
                                   String idempotencyKey,
                                   String accountFrom,
                                   String accountTo,
                                   BigDecimal amount,
                                   String currency,
                                   LedgerEntryType entryType,
                                   String metadataJson) {

        Optional<LedgerEntry> existing = ledgerRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            return existing.get();
        }

        LedgerEntry entry = new LedgerEntry(
                transactionId,
                idempotencyKey,
                accountFrom,
                accountTo,
                amount,
                currency != null ? currency : "INR",
                entryType,
                metadataJson
        );

        return ledgerRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public List<LedgerEntry> getAllEntries() {
        return ledgerRepository.findAllByOrderByCreatedAtDesc();
    }
}
