package com.antiscam.ticketing.service;

import com.antiscam.ticketing.config.SystemSettingsCache;
import com.antiscam.ticketing.dto.EventRequests;
import com.antiscam.ticketing.dto.EventResponses;
import com.antiscam.ticketing.entity.*;
import com.antiscam.ticketing.repository.EventRepository;
import com.antiscam.ticketing.repository.HostProfileRepository;
import com.antiscam.ticketing.repository.TicketRepository;
import com.antiscam.ticketing.repository.VenueDisputeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final HostProfileRepository hostProfileRepository;
    private final TicketRepository ticketRepository;
    private final VenueDisputeRepository disputeRepository;
    private final SystemSettingsCache settingsCache;

    public EventService(EventRepository eventRepository,
                        HostProfileRepository hostProfileRepository,
                        TicketRepository ticketRepository,
                        VenueDisputeRepository disputeRepository,
                        SystemSettingsCache settingsCache) {
        this.eventRepository = eventRepository;
        this.hostProfileRepository = hostProfileRepository;
        this.ticketRepository = ticketRepository;
        this.disputeRepository = disputeRepository;
        this.settingsCache = settingsCache;
    }

    @Transactional
    public Event createEvent(User hostUser, EventRequests.CreateEventRequest request) {
        HostProfile hostProfile = hostProfileRepository.findByUserId(hostUser.getId())
                .orElseThrow(() -> new IllegalStateException("Host profile not found. Please complete KYC onboarding."));

        if (hostProfile.getKycStatus() != KycStatus.VERIFIED) {
            throw new IllegalStateException("Host KYC is not verified. Current status: " + hostProfile.getKycStatus());
        }

        if (request.getEndTime().isBefore(request.getStartTime())) {
            throw new IllegalArgumentException("Event end time must be after start time");
        }

        long holdDurationSeconds = settingsCache.getEscrowHoldDurationSeconds();
        OffsetDateTime escrowReleaseTime = request.getEndTime().plusSeconds(holdDurationSeconds);

        Event event = new Event();
        event.setHost(hostUser);
        event.setTitle(request.getTitle());
        event.setDescriptionMarkdown(request.getDescriptionMarkdown());
        event.setVenueName(request.getVenueName());
        event.setVenueAddress(request.getVenueAddress());
        event.setVenueLatitude(request.getVenueLatitude());
        event.setVenueLongitude(request.getVenueLongitude());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setEscrowReleaseTime(escrowReleaseTime);
        event.setStatus(EventStatus.PENDING_VERIFICATION);
        event.setVenueBookingProofUrl(request.getVenueBookingProofUrl());

        List<TicketTier> tiers = new ArrayList<>();
        for (EventRequests.TicketTierRequest tierReq : request.getTicketTiers()) {
            TicketTier tier = new TicketTier();
            tier.setEvent(event);
            tier.setName(tierReq.getName());
            tier.setPrice(tierReq.getPrice());
            tier.setTotalCapacity(tierReq.getTotalCapacity());
            tier.setReservedCount(0);
            tier.setSoldCount(0);
            tiers.add(tier);
        }
        event.setTicketTiers(tiers);

        return eventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public List<EventResponses.EventDetailResponse> getLiveEvents() {
        return eventRepository.findByStatus(EventStatus.VERIFIED_LIVE).stream()
                .map(this::mapToDetailResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EventResponses.EventDetailResponse> getHostEvents(User hostUser) {
        return eventRepository.findByHostId(hostUser.getId()).stream()
                .map(this::mapToDetailResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EventResponses.EventDetailResponse> getAllEventsForAdmin() {
        return eventRepository.findAll().stream()
                .map(this::mapToDetailResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EventResponses.EventDetailResponse getEventDetail(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found with ID: " + eventId));
        return mapToDetailResponse(event);
    }

    @Transactional
    public Event verifyEvent(Long eventId, boolean approve) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found with ID: " + eventId));

        if (approve) {
            event.setStatus(EventStatus.VERIFIED_LIVE);
        } else {
            event.setStatus(EventStatus.DRAFT);
        }
        return eventRepository.save(event);
    }

    public EventResponses.EventDetailResponse mapToDetailResponse(Event event) {
        EventResponses.EventDetailResponse resp = new EventResponses.EventDetailResponse();
        resp.setId(event.getId());
        resp.setHostId(event.getHost().getId());
        resp.setHostName(event.getHost().getFullName());

        hostProfileRepository.findByUserId(event.getHost().getId())
                .ifPresent(p -> resp.setHostBusinessName(p.getBusinessName()));

        resp.setTitle(event.getTitle());
        resp.setDescriptionMarkdown(event.getDescriptionMarkdown());
        resp.setVenueName(event.getVenueName());
        resp.setVenueAddress(event.getVenueAddress());
        resp.setVenueLatitude(event.getVenueLatitude());
        resp.setVenueLongitude(event.getVenueLongitude());
        resp.setStartTime(event.getStartTime());
        resp.setEndTime(event.getEndTime());
        resp.setEscrowReleaseTime(event.getEscrowReleaseTime());
        resp.setStatus(event.getStatus());
        resp.setVenueBookingProofUrl(event.getVenueBookingProofUrl());

        List<EventResponses.TicketTierDTO> tierDTOs = event.getTicketTiers().stream().map(t -> {
            EventResponses.TicketTierDTO dto = new EventResponses.TicketTierDTO();
            dto.setId(t.getId());
            dto.setName(t.getName());
            dto.setPrice(t.getPrice());
            dto.setTotalCapacity(t.getTotalCapacity());
            dto.setReservedCount(t.getReservedCount());
            dto.setSoldCount(t.getSoldCount());
            dto.setAvailableSeats(t.getAvailableSeats());
            return dto;
        }).collect(Collectors.toList());
        resp.setTicketTiers(tierDTOs);

        long sold = ticketRepository.countByEventId(event.getId());
        long checkedIn = ticketRepository.countByEventIdAndStatus(event.getId(), TicketStatus.CHECKED_IN);
        long disputes = disputeRepository.countByEventId(event.getId());

        resp.setTotalTicketsSold(sold);
        resp.setCheckedInCount(checkedIn);
        resp.setDisputeCount(disputes);

        return resp;
    }
}
