package com.antiscam.ticketing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ledger_entries")
public class LedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entry_id", nullable = false, unique = true)
    private UUID entryId = UUID.randomUUID();

    @Column(name = "transaction_id", nullable = false, length = 128)
    private String transactionId;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 128)
    private String idempotencyKey;

    @Column(name = "account_from", nullable = false, length = 100)
    private String accountFrom;

    @Column(name = "account_to", nullable = false, length = 100)
    private String accountTo;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 10)
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 50)
    private LedgerEntryType entryType;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public LedgerEntry() {}

    public LedgerEntry(String transactionId, String idempotencyKey, String accountFrom, String accountTo,
                       BigDecimal amount, String currency, LedgerEntryType entryType, String metadataJson) {
        this.entryId = UUID.randomUUID();
        this.transactionId = transactionId;
        this.idempotencyKey = idempotencyKey;
        this.accountFrom = accountFrom;
        this.accountTo = accountTo;
        this.amount = amount;
        this.currency = (currency != null) ? currency : "INR";
        this.entryType = entryType;
        this.metadataJson = metadataJson;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public UUID getEntryId() { return entryId; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    public String getAccountFrom() { return accountFrom; }
    public void setAccountFrom(String accountFrom) { this.accountFrom = accountFrom; }
    public String getAccountTo() { return accountTo; }
    public void setAccountTo(String accountTo) { this.accountTo = accountTo; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public LedgerEntryType getEntryType() { return entryType; }
    public void setEntryType(LedgerEntryType entryType) { this.entryType = entryType; }
    public String getMetadataJson() { return metadataJson; }
    public void setMetadataJson(String metadataJson) { this.metadataJson = metadataJson; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
