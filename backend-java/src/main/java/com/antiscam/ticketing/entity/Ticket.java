package com.antiscam.ticketing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "tickets")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_number", nullable = false, unique = true, length = 64)
    private String ticketNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_tier_id", nullable = false)
    private TicketTier ticketTier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "purchase_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "payment_gateway_order_id", length = 128)
    private String paymentGatewayOrderId;

    @Column(name = "payment_gateway_payment_id", length = 128)
    private String paymentGatewayPaymentId;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 128)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TicketStatus status = TicketStatus.PAID_HELD_IN_ESCROW;

    @Column(name = "qr_code_signature", nullable = false, columnDefinition = "TEXT")
    private String qrCodeSignature;

    @Column(name = "checked_in_at")
    private OffsetDateTime checkedInAt;

    @Column(name = "check_in_latitude", precision = 10, scale = 7)
    private BigDecimal checkInLatitude;

    @Column(name = "check_in_longitude", precision = 10, scale = 7)
    private BigDecimal checkInLongitude;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public Ticket() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTicketNumber() { return ticketNumber; }
    public void setTicketNumber(String ticketNumber) { this.ticketNumber = ticketNumber; }
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
    public TicketTier getTicketTier() { return ticketTier; }
    public void setTicketTier(TicketTier ticketTier) { this.ticketTier = ticketTier; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public BigDecimal getPurchasePrice() { return purchasePrice; }
    public void setPurchasePrice(BigDecimal purchasePrice) { this.purchasePrice = purchasePrice; }
    public String getPaymentGatewayOrderId() { return paymentGatewayOrderId; }
    public void setPaymentGatewayOrderId(String paymentGatewayOrderId) { this.paymentGatewayOrderId = paymentGatewayOrderId; }
    public String getPaymentGatewayPaymentId() { return paymentGatewayPaymentId; }
    public void setPaymentGatewayPaymentId(String paymentGatewayPaymentId) { this.paymentGatewayPaymentId = paymentGatewayPaymentId; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    public TicketStatus getStatus() { return status; }
    public void setStatus(TicketStatus status) { this.status = status; }
    public String getQrCodeSignature() { return qrCodeSignature; }
    public void setQrCodeSignature(String qrCodeSignature) { this.qrCodeSignature = qrCodeSignature; }
    public OffsetDateTime getCheckedInAt() { return checkedInAt; }
    public void setCheckedInAt(OffsetDateTime checkedInAt) { this.checkedInAt = checkedInAt; }
    public BigDecimal getCheckInLatitude() { return checkInLatitude; }
    public void setCheckInLatitude(BigDecimal checkInLatitude) { this.checkInLatitude = checkInLatitude; }
    public BigDecimal getCheckInLongitude() { return checkInLongitude; }
    public void setCheckInLongitude(BigDecimal checkInLongitude) { this.checkInLongitude = checkInLongitude; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
