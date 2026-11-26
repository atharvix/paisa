package com.antiscam.ticketing.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "webhook_logs")
public class WebhookLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id_header", length = 128)
    private String eventIdHeader;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(nullable = false)
    private String signature;

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;

    @Column(name = "processing_status", nullable = false, length = 50)
    private String processingStatus = "RECEIVED";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public WebhookLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEventIdHeader() { return eventIdHeader; }
    public void setEventIdHeader(String eventIdHeader) { this.eventIdHeader = eventIdHeader; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }
    public Boolean getIsVerified() { return isVerified; }
    public void setIsVerified(Boolean isVerified) { this.isVerified = isVerified; }
    public String getProcessingStatus() { return processingStatus; }
    public void setProcessingStatus(String processingStatus) { this.processingStatus = processingStatus; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
