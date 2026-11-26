package com.antiscam.ticketing.dto;

import com.antiscam.ticketing.entity.TicketStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class CheckoutDTOs {

    public static class CheckoutInitiateRequest {
        @NotNull(message = "Event ID is required")
        private Long eventId;

        @NotNull(message = "Ticket tier ID is required")
        private Long ticketTierId;

        @NotBlank(message = "Idempotency key is required")
        private String idempotencyKey;

        public CheckoutInitiateRequest() {}

        public Long getEventId() { return eventId; }
        public void setEventId(Long eventId) { this.eventId = eventId; }
        public Long getTicketTierId() { return ticketTierId; }
        public void setTicketTierId(Long ticketTierId) { this.ticketTierId = ticketTierId; }
        public String getIdempotencyKey() { return idempotencyKey; }
        public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    }

    public static class OrderInitiateResponse {
        private String razorpayOrderId;
        private BigDecimal amount;
        private String currency;
        private String keyId;
        private String idempotencyKey;
        private Long ticketTierId;
        private String tierName;
        private String eventTitle;

        public OrderInitiateResponse() {}

        public String getRazorpayOrderId() { return razorpayOrderId; }
        public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getKeyId() { return keyId; }
        public void setKeyId(String keyId) { this.keyId = keyId; }
        public String getIdempotencyKey() { return idempotencyKey; }
        public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
        public Long getTicketTierId() { return ticketTierId; }
        public void setTicketTierId(Long ticketTierId) { this.ticketTierId = ticketTierId; }
        public String getTierName() { return tierName; }
        public void setTierName(String tierName) { this.tierName = tierName; }
        public String getEventTitle() { return eventTitle; }
        public void setEventTitle(String eventTitle) { this.eventTitle = eventTitle; }
    }

    public static class PaymentVerifyRequest {
        @NotBlank(message = "Razorpay order ID is required")
        private String razorpayOrderId;

        @NotBlank(message = "Razorpay payment ID is required")
        private String razorpayPaymentId;

        private String razorpaySignature;

        @NotBlank(message = "Idempotency key is required")
        private String idempotencyKey;

        public PaymentVerifyRequest() {}

        public String getRazorpayOrderId() { return razorpayOrderId; }
        public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }
        public String getRazorpayPaymentId() { return razorpayPaymentId; }
        public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }
        public String getRazorpaySignature() { return razorpaySignature; }
        public void setRazorpaySignature(String razorpaySignature) { this.razorpaySignature = razorpaySignature; }
        public String getIdempotencyKey() { return idempotencyKey; }
        public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    }

    public static class TicketDetailResponse {
        private Long id;
        private String ticketNumber;
        private Long eventId;
        private String eventTitle;
        private String venueName;
        private String venueAddress;
        private BigDecimal venueLatitude;
        private BigDecimal venueLongitude;
        private OffsetDateTime startTime;
        private OffsetDateTime endTime;
        private String tierName;
        private BigDecimal purchasePrice;
        private TicketStatus status;
        private String qrCodeSignature;
        private OffsetDateTime checkedInAt;
        private OffsetDateTime escrowReleaseTime;
        private String idempotencyKey;

        public TicketDetailResponse() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getTicketNumber() { return ticketNumber; }
        public void setTicketNumber(String ticketNumber) { this.ticketNumber = ticketNumber; }
        public Long getEventId() { return eventId; }
        public void setEventId(Long eventId) { this.eventId = eventId; }
        public String getEventTitle() { return eventTitle; }
        public void setEventTitle(String eventTitle) { this.eventTitle = eventTitle; }
        public String getVenueName() { return venueName; }
        public void setVenueName(String venueName) { this.venueName = venueName; }
        public String getVenueAddress() { return venueAddress; }
        public void setVenueAddress(String venueAddress) { this.venueAddress = venueAddress; }
        public BigDecimal getVenueLatitude() { return venueLatitude; }
        public void setVenueLatitude(BigDecimal venueLatitude) { this.venueLatitude = venueLatitude; }
        public BigDecimal getVenueLongitude() { return venueLongitude; }
        public void setVenueLongitude(BigDecimal venueLongitude) { this.venueLongitude = venueLongitude; }
        public OffsetDateTime getStartTime() { return startTime; }
        public void setStartTime(OffsetDateTime startTime) { this.startTime = startTime; }
        public OffsetDateTime getEndTime() { return endTime; }
        public void setEndTime(OffsetDateTime endTime) { this.endTime = endTime; }
        public String getTierName() { return tierName; }
        public void setTierName(String tierName) { this.tierName = tierName; }
        public BigDecimal getPurchasePrice() { return purchasePrice; }
        public void setPurchasePrice(BigDecimal purchasePrice) { this.purchasePrice = purchasePrice; }
        public TicketStatus getStatus() { return status; }
        public void setStatus(TicketStatus status) { this.status = status; }
        public String getQrCodeSignature() { return qrCodeSignature; }
        public void setQrCodeSignature(String qrCodeSignature) { this.qrCodeSignature = qrCodeSignature; }
        public OffsetDateTime getCheckedInAt() { return checkedInAt; }
        public void setCheckedInAt(OffsetDateTime checkedInAt) { this.checkedInAt = checkedInAt; }
        public OffsetDateTime getEscrowReleaseTime() { return escrowReleaseTime; }
        public void setEscrowReleaseTime(OffsetDateTime escrowReleaseTime) { this.escrowReleaseTime = escrowReleaseTime; }
        public String getIdempotencyKey() { return idempotencyKey; }
        public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    }
}
