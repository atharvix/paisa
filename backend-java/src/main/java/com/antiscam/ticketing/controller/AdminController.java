package com.antiscam.ticketing.controller;

import com.antiscam.ticketing.dto.ApiResponse;
import com.antiscam.ticketing.dto.EscrowDTOs;
import com.antiscam.ticketing.dto.EventResponses;
import com.antiscam.ticketing.entity.*;
import com.antiscam.ticketing.repository.EscrowTransferRepository;
import com.antiscam.ticketing.repository.EventRepository;
import com.antiscam.ticketing.repository.VenueDisputeRepository;
import com.antiscam.ticketing.service.EventService;
import com.antiscam.ticketing.service.HostKycService;
import com.antiscam.ticketing.service.LedgerService;
import com.antiscam.ticketing.service.SystemSettingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final HostKycService hostKycService;
    private final EventService eventService;
    private final EventRepository eventRepository;
    private final VenueDisputeRepository disputeRepository;
    private final EscrowTransferRepository escrowTransferRepository;
    private final SystemSettingService settingService;
    private final LedgerService ledgerService;

    public AdminController(HostKycService hostKycService,
                           EventService eventService,
                           EventRepository eventRepository,
                           VenueDisputeRepository disputeRepository,
                           EscrowTransferRepository escrowTransferRepository,
                           SystemSettingService settingService,
                           LedgerService ledgerService) {
        this.hostKycService = hostKycService;
        this.eventService = eventService;
        this.eventRepository = eventRepository;
        this.disputeRepository = disputeRepository;
        this.escrowTransferRepository = escrowTransferRepository;
        this.settingService = settingService;
        this.ledgerService = ledgerService;
    }

    @GetMapping("/kyc-queue")
    public ResponseEntity<ApiResponse<List<HostProfile>>> getPendingKycQueue() {
        return ResponseEntity.ok(ApiResponse.ok(hostKycService.getPendingKycQueue()));
    }

    @PostMapping("/verify-kyc/{profileId}")
    public ResponseEntity<ApiResponse<HostProfile>> verifyKyc(
            @PathVariable Long profileId,
            @RequestParam boolean approve,
            @RequestParam(required = false) String reason) {
        HostProfile profile = hostKycService.verifyKyc(profileId, approve, reason);
        return ResponseEntity.ok(ApiResponse.ok(approve ? "Host KYC approved" : "Host KYC rejected", profile));
    }

    @GetMapping("/events-queue")
    public ResponseEntity<ApiResponse<List<EventResponses.EventDetailResponse>>> getAllEvents() {
        return ResponseEntity.ok(ApiResponse.ok(eventService.getAllEventsForAdmin()));
    }

    @PostMapping("/verify-event/{eventId}")
    public ResponseEntity<ApiResponse<Event>> verifyEvent(
            @PathVariable Long eventId,
            @RequestParam boolean approve) {
        Event event = eventService.verifyEvent(eventId, approve);
        return ResponseEntity.ok(ApiResponse.ok(approve ? "Event approved and live for ticket sales" : "Event rejected/drafted", event));
    }

    @GetMapping("/disputes")
    public ResponseEntity<ApiResponse<List<VenueDispute>>> getAllDisputes() {
        return ResponseEntity.ok(ApiResponse.ok(disputeRepository.findAllByOrderByCreatedAtDesc()));
    }

    @PostMapping("/dispute-action")
    @Transactional
    public ResponseEntity<ApiResponse<String>> handleDisputeAction(
            @Valid @RequestBody EscrowDTOs.DisputeActionRequest request) {

        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        if ("FORCE_FREEZE_AND_REFUND".equalsIgnoreCase(request.getAction())) {
            event.setStatus(EventStatus.FROZEN_DISPUTE);
            eventRepository.save(event);

            escrowTransferRepository.findByEventId(event.getId()).ifPresent(escrow -> {
                escrow.setStatus(EscrowStatus.FROZEN_DISPUTE);
                escrow.setDisputeReason("Admin manual override: Confirmed scam/empty venue fraud. Escrow frozen for attendee refunds.");
                escrowTransferRepository.save(escrow);

                ledgerService.recordEntry(
                        "DISPUTE_FREEZE_" + event.getId() + "_" + System.currentTimeMillis(),
                        "LEDGER_FREEZE_" + event.getId() + "_" + System.currentTimeMillis(),
                        "ESCROW_POOL_EVENT_" + event.getId(),
                        "DISPUTE_FROZEN_HOLD",
                        escrow.getGrossAmount(),
                        "INR",
                        LedgerEntryType.DISPUTE_FREEZE,
                        "{\"adminNotes\":\"" + request.getAdminNotes() + "\"}"
                );
            });
            return ResponseEntity.ok(ApiResponse.ok("Event escrow forcibly frozen and attendee refund cycle initiated.", null));
        } else if ("DISMISS_DISPUTE_AND_RELEASE".equalsIgnoreCase(request.getAction())) {
            event.setStatus(EventStatus.VERIFIED_LIVE);
            eventRepository.save(event);

            escrowTransferRepository.findByEventId(event.getId()).ifPresent(escrow -> {
                escrow.setStatus(EscrowStatus.ON_HOLD);
                escrow.setDisputeReason("Admin verified legitimacy: false dispute reports dismissed.");
                escrowTransferRepository.save(escrow);
            });
            return ResponseEntity.ok(ApiResponse.ok("Disputes dismissed. Escrow restored to normal clearance schedule.", null));
        } else {
            throw new IllegalArgumentException("Unknown dispute action: " + request.getAction());
        }
    }

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<List<SystemSetting>>> getAllSettings() {
        return ResponseEntity.ok(ApiResponse.ok(settingService.getAllSettings()));
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<SystemSetting>> updateSetting(
            @Valid @RequestBody EscrowDTOs.SystemSettingUpdateDTO updateDto,
            Authentication authentication) {
        String adminName = authentication != null ? authentication.getName() : "ADMIN";
        SystemSetting updated = settingService.updateSetting(updateDto, adminName);
        return ResponseEntity.ok(ApiResponse.ok("System setting updated successfully in real-time", updated));
    }

    @GetMapping("/ledger")
    public ResponseEntity<ApiResponse<List<LedgerEntry>>> getLedgerEntries() {
        return ResponseEntity.ok(ApiResponse.ok(ledgerService.getAllEntries()));
    }
}
