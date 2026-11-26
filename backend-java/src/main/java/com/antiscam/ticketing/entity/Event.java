package com.antiscam.ticketing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @Column(nullable = false)
    private String title;

    @Column(name = "description_markdown", nullable = false, columnDefinition = "TEXT")
    private String descriptionMarkdown;

    @Column(name = "venue_name", nullable = false)
    private String venueName;

    @Column(name = "venue_address", nullable = false, columnDefinition = "TEXT")
    private String venueAddress;

    @Column(name = "venue_latitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal venueLatitude;

    @Column(name = "venue_longitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal venueLongitude;

    @Column(name = "start_time", nullable = false)
    private OffsetDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private OffsetDateTime endTime;

    @Column(name = "escrow_release_time", nullable = false)
    private OffsetDateTime escrowReleaseTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EventStatus status = EventStatus.DRAFT;

    @Column(name = "venue_booking_proof_url", nullable = false, columnDefinition = "TEXT")
    private String venueBookingProofUrl;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TicketTier> ticketTiers = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public Event() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getHost() { return host; }
    public void setHost(User host) { this.host = host; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescriptionMarkdown() { return descriptionMarkdown; }
    public void setDescriptionMarkdown(String descriptionMarkdown) { this.descriptionMarkdown = descriptionMarkdown; }
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
    public OffsetDateTime getEscrowReleaseTime() { return escrowReleaseTime; }
    public void setEscrowReleaseTime(OffsetDateTime escrowReleaseTime) { this.escrowReleaseTime = escrowReleaseTime; }
    public EventStatus getStatus() { return status; }
    public void setStatus(EventStatus status) { this.status = status; }
    public String getVenueBookingProofUrl() { return venueBookingProofUrl; }
    public void setVenueBookingProofUrl(String venueBookingProofUrl) { this.venueBookingProofUrl = venueBookingProofUrl; }
    public List<TicketTier> getTicketTiers() { return ticketTiers; }
    public void setTicketTiers(List<TicketTier> ticketTiers) { this.ticketTiers = ticketTiers; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
