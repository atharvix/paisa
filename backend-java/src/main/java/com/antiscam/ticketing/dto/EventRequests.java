package com.antiscam.ticketing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public class EventRequests {

    public static class TicketTierRequest {
        @NotBlank(message = "Tier name is required")
        private String name;

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "Price must be >= 0")
        private BigDecimal price;

        @NotNull(message = "Total capacity is required")
        @Min(value = 1, message = "Capacity must be at least 1")
        private Integer totalCapacity;

        public TicketTierRequest() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public Integer getTotalCapacity() { return totalCapacity; }
        public void setTotalCapacity(Integer totalCapacity) { this.totalCapacity = totalCapacity; }
    }

    public static class CreateEventRequest {
        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Markdown description is required")
        private String descriptionMarkdown;

        @NotBlank(message = "Venue name is required")
        private String venueName;

        @NotBlank(message = "Venue address is required")
        private String venueAddress;

        @NotNull(message = "Venue latitude is required")
        private BigDecimal venueLatitude;

        @NotNull(message = "Venue longitude is required")
        private BigDecimal venueLongitude;

        @NotNull(message = "Start time is required")
        private OffsetDateTime startTime;

        @NotNull(message = "End time is required")
        private OffsetDateTime endTime;

        @NotBlank(message = "Venue booking proof document URL is required")
        private String venueBookingProofUrl;

        @NotEmpty(message = "At least one ticket tier is required")
        private List<TicketTierRequest> ticketTiers;

        public CreateEventRequest() {}

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
        public String getVenueBookingProofUrl() { return venueBookingProofUrl; }
        public void setVenueBookingProofUrl(String venueBookingProofUrl) { this.venueBookingProofUrl = venueBookingProofUrl; }
        public List<TicketTierRequest> getTicketTiers() { return ticketTiers; }
        public void setTicketTiers(List<TicketTierRequest> ticketTiers) { this.ticketTiers = ticketTiers; }
    }
}
