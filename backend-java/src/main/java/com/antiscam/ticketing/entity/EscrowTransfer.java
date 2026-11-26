package com.antiscam.ticketing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "escrow_transfers")
public class EscrowTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "host_account_id", nullable = false, length = 100)
    private String hostAccountId;

    @Column(name = "gross_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal grossAmount = BigDecimal.ZERO;

    @Column(name = "platform_fee_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal platformFeePercent = new BigDecimal("10.0");

    @Column(name = "platform_fee_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal platformFeeAmount = BigDecimal.ZERO;

    @Column(name = "gateway_fee_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal gatewayFeeAmount = BigDecimal.ZERO;

    @Column(name = "net_payout_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal netPayoutAmount = BigDecimal.ZERO;

    @Column(name = "razorpay_transfer_id", length = 128)
    private String razorpayTransferId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EscrowStatus status = EscrowStatus.ON_HOLD;

    @Column(name = "on_hold_until", nullable = false)
    private OffsetDateTime onHoldUntil;

    @Column(name = "released_at")
    private OffsetDateTime releasedAt;

    @Column(name = "dispute_reason", columnDefinition = "TEXT")
    private String disputeReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public EscrowTransfer() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
    public String getHostAccountId() { return hostAccountId; }
    public void setHostAccountId(String hostAccountId) { this.hostAccountId = hostAccountId; }
    public BigDecimal getGrossAmount() { return grossAmount; }
    public void setGrossAmount(BigDecimal grossAmount) { this.grossAmount = grossAmount; }
    public BigDecimal getPlatformFeePercent() { return platformFeePercent; }
    public void setPlatformFeePercent(BigDecimal platformFeePercent) { this.platformFeePercent = platformFeePercent; }
    public BigDecimal getPlatformFeeAmount() { return platformFeeAmount; }
    public void setPlatformFeeAmount(BigDecimal platformFeeAmount) { this.platformFeeAmount = platformFeeAmount; }
    public BigDecimal getGatewayFeeAmount() { return gatewayFeeAmount; }
    public void setGatewayFeeAmount(BigDecimal gatewayFeeAmount) { this.gatewayFeeAmount = gatewayFeeAmount; }
    public BigDecimal getNetPayoutAmount() { return netPayoutAmount; }
    public void setNetPayoutAmount(BigDecimal netPayoutAmount) { this.netPayoutAmount = netPayoutAmount; }
    public String getRazorpayTransferId() { return razorpayTransferId; }
    public void setRazorpayTransferId(String razorpayTransferId) { this.razorpayTransferId = razorpayTransferId; }
    public EscrowStatus getStatus() { return status; }
    public void setStatus(EscrowStatus status) { this.status = status; }
    public OffsetDateTime getOnHoldUntil() { return onHoldUntil; }
    public void setOnHoldUntil(OffsetDateTime onHoldUntil) { this.onHoldUntil = onHoldUntil; }
    public OffsetDateTime getReleasedAt() { return releasedAt; }
    public void setReleasedAt(OffsetDateTime releasedAt) { this.releasedAt = releasedAt; }
    public String getDisputeReason() { return disputeReason; }
    public void setDisputeReason(String disputeReason) { this.disputeReason = disputeReason; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
