package com.antiscam.ticketing.dto;

import com.antiscam.ticketing.entity.EscrowStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class EscrowDTOs {

    public static class EscrowBreakdownResponse {
        private Long eventId;
        private String eventTitle;
        private String hostAccountId;
        private BigDecimal grossTicketSales;
        private BigDecimal gatewayFeeAmount;     // ~2%
        private BigDecimal platformFeePercent;    // configurable %
        private BigDecimal platformFeeAmount;
        private BigDecimal netHeldPayout;         // ON_HOLD
        private EscrowStatus escrowStatus;
        private OffsetDateTime onHoldUntil;
        private Long secondsRemainingToRelease;
        private boolean canSelfCancel;
        private String hostExternalAccountNote;

        public EscrowBreakdownResponse() {}

        public Long getEventId() { return eventId; }
        public void setEventId(Long eventId) { this.eventId = eventId; }
        public String getEventTitle() { return eventTitle; }
        public void setEventTitle(String eventTitle) { this.eventTitle = eventTitle; }
        public String getHostAccountId() { return hostAccountId; }
        public void setHostAccountId(String hostAccountId) { this.hostAccountId = hostAccountId; }
        public BigDecimal getGrossTicketSales() { return grossTicketSales; }
        public void setGrossTicketSales(BigDecimal grossTicketSales) { this.grossTicketSales = grossTicketSales; }
        public BigDecimal getGatewayFeeAmount() { return gatewayFeeAmount; }
        public void setGatewayFeeAmount(BigDecimal gatewayFeeAmount) { this.gatewayFeeAmount = gatewayFeeAmount; }
        public BigDecimal getPlatformFeePercent() { return platformFeePercent; }
        public void setPlatformFeePercent(BigDecimal platformFeePercent) { this.platformFeePercent = platformFeePercent; }
        public BigDecimal getPlatformFeeAmount() { return platformFeeAmount; }
        public void setPlatformFeeAmount(BigDecimal platformFeeAmount) { this.platformFeeAmount = platformFeeAmount; }
        public BigDecimal getNetHeldPayout() { return netHeldPayout; }
        public void setNetHeldPayout(BigDecimal netHeldPayout) { this.netHeldPayout = netHeldPayout; }
        public EscrowStatus getEscrowStatus() { return escrowStatus; }
        public void setEscrowStatus(EscrowStatus escrowStatus) { this.escrowStatus = escrowStatus; }
        public OffsetDateTime getOnHoldUntil() { return onHoldUntil; }
        public void setOnHoldUntil(OffsetDateTime onHoldUntil) { this.onHoldUntil = onHoldUntil; }
        public Long getSecondsRemainingToRelease() { return secondsRemainingToRelease; }
        public void setSecondsRemainingToRelease(Long secondsRemainingToRelease) { this.secondsRemainingToRelease = secondsRemainingToRelease; }
        public boolean isCanSelfCancel() { return canSelfCancel; }
        public void setCanSelfCancel(boolean canSelfCancel) { this.canSelfCancel = canSelfCancel; }
        public String getHostExternalAccountNote() { return hostExternalAccountNote; }
        public void setHostExternalAccountNote(String hostExternalAccountNote) { this.hostExternalAccountNote = hostExternalAccountNote; }
    }

    public static class HostKycRequest {
        @NotBlank(message = "PAN number is required")
        private String panNumber;

        @NotBlank(message = "Bank account number is required")
        private String bankAccountNumber;

        @NotBlank(message = "Bank IFSC is required")
        private String bankIfsc;

        @NotBlank(message = "Business name is required")
        private String businessName;

        @NotBlank(message = "Business entity type is required")
        private String businessEntityType;

        @NotBlank(message = "KYC document proof URL is required")
        private String kycDocumentUrl;

        public HostKycRequest() {}

        public String getPanNumber() { return panNumber; }
        public void setPanNumber(String panNumber) { this.panNumber = panNumber; }
        public String getBankAccountNumber() { return bankAccountNumber; }
        public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }
        public String getBankIfsc() { return bankIfsc; }
        public void setBankIfsc(String bankIfsc) { this.bankIfsc = bankIfsc; }
        public String getBusinessName() { return businessName; }
        public void setBusinessName(String businessName) { this.businessName = businessName; }
        public String getBusinessEntityType() { return businessEntityType; }
        public void setBusinessEntityType(String businessEntityType) { this.businessEntityType = businessEntityType; }
        public String getKycDocumentUrl() { return kycDocumentUrl; }
        public void setKycDocumentUrl(String kycDocumentUrl) { this.kycDocumentUrl = kycDocumentUrl; }
    }

    public static class DisputeActionRequest {
        @NotNull(message = "Event ID is required")
        private Long eventId;

        @NotBlank(message = "Action is required: FORCE_FREEZE_AND_REFUND or DISMISS_DISPUTE_AND_RELEASE")
        private String action; // FORCE_FREEZE_AND_REFUND or DISMISS_DISPUTE_AND_RELEASE

        private String adminNotes;

        public DisputeActionRequest() {}

        public Long getEventId() { return eventId; }
        public void setEventId(Long eventId) { this.eventId = eventId; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public String getAdminNotes() { return adminNotes; }
        public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    }

    public static class SystemSettingUpdateDTO {
        @NotBlank(message = "Setting key is required")
        private String key;

        @NotBlank(message = "Setting value is required")
        private String value;

        private String description;

        public SystemSettingUpdateDTO() {}

        public String getKey() { return key; }
        public void setKey(String key) { this.key = key; }
        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}
