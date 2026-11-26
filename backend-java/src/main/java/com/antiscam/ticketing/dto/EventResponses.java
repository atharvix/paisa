package com.antiscam.ticketing.dto;

import com.antiscam.ticketing.entity.EventStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public class EventResponses {

    public static class TicketTierDTO {
        private Long id;
        private String name;
        private BigDecimal price;
        private Integer totalCapacity;
        private Integer reservedCount;
        private Integer soldCount;
        private Integer availableSeats;

        public TicketTierDTO() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public Integer getTotalCapacity() { return totalCapacity; }
        public void setTotalCapacity(Integer totalCapacity) { this.totalCapacity = totalCapacity; }
        public Integer getReservedCount() { return reservedCount; }
        public void setReservedCount(Integer reservedCount) { this.reservedCount = reservedCount; }
        public Integer getSoldCount() { return soldCount; }
        public void setSoldCount(Integer soldCount) { this.soldCount = soldCount; }
        public Integer getAvailableSeats() { return availableSeats; }
        public void setAvailableSeats(Integer availableSeats) { this.availableSeats = availableSeats; }
    }

    public static class EventDetailResponse {
        private Long id;
        private Long hostId;
        private String hostName;
        private String hostBusinessName;
        private String title;
        private String descriptionMarkdown;
        private String venueName;
        private String venueAddress;
        private BigDecimal venueLatitude;
        private BigDecimal venueLongitude;
        private OffsetDateTime startTime;
        private OffsetDateTime endTime;
        private OffsetDateTime escrowReleaseTime;
        private EventStatus status;
        private String venueBookingProofUrl;
        private List<TicketTierDTO> ticketTiers;
        private Long totalTicketsSold;
        private Long checkedInCount;
        private Long disputeCount;

        public EventDetailResponse() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getHostId() { return hostId; }
        public void setHostId(Long hostId) { this.hostId = hostId; }
        public String getHostName() { return hostName; }
        public void setHostName(String hostName) { this.hostName = hostName; }
        public String getHostBusinessName() { return hostBusinessName; }
        public void setHostBusinessName(String hostBusinessName) { this.hostBusinessName = hostBusinessName; }
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
        public List<TicketTierDTO> getTicketTiers() { return ticketTiers; }
        public void setTicketTiers(List<TicketTierDTO> ticketTiers) { this.ticketTiers = ticketTiers; }
        public Long getTotalTicketsSold() { return totalTicketsSold; }
        public void setTotalTicketsSold(Long totalTicketsSold) { this.totalTicketsSold = totalTicketsSold; }
        public Long getCheckedInCount() { return checkedInCount; }
        public void setCheckedInCount(Long checkedInCount) { this.checkedInCount = checkedInCount; }
        public Long getDisputeCount() { return disputeCount; }
        public void setDisputeCount(Long disputeCount) { this.disputeCount = disputeCount; }
    }
}
