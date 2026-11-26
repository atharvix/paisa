package com.antiscam.ticketing.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "host_profiles")
public class HostProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "pan_number", nullable = false, length = 20)
    private String panNumber;

    @Column(name = "bank_account_number", nullable = false, length = 50)
    private String bankAccountNumber;

    @Column(name = "bank_ifsc", nullable = false, length = 20)
    private String bankIfsc;

    @Column(name = "business_name", nullable = false)
    private String businessName;

    @Column(name = "business_entity_type", nullable = false, length = 50)
    private String businessEntityType;

    @Column(name = "razorpay_account_id", length = 100)
    private String razorpayAccountId; // e.g. acc_xxx

    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status", nullable = false, length = 50)
    private KycStatus kycStatus = KycStatus.PENDING;

    @Column(name = "kyc_document_url", columnDefinition = "TEXT")
    private String kycDocumentUrl;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public HostProfile() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
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
    public String getRazorpayAccountId() { return razorpayAccountId; }
    public void setRazorpayAccountId(String razorpayAccountId) { this.razorpayAccountId = razorpayAccountId; }
    public KycStatus getKycStatus() { return kycStatus; }
    public void setKycStatus(KycStatus kycStatus) { this.kycStatus = kycStatus; }
    public String getKycDocumentUrl() { return kycDocumentUrl; }
    public void setKycDocumentUrl(String kycDocumentUrl) { this.kycDocumentUrl = kycDocumentUrl; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
