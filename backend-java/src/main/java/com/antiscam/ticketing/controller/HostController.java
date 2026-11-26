package com.antiscam.ticketing.controller;

import com.antiscam.ticketing.config.SystemSettingsCache;
import com.antiscam.ticketing.dto.ApiResponse;
import com.antiscam.ticketing.dto.EscrowDTOs;
import com.antiscam.ticketing.entity.*;
import com.antiscam.ticketing.repository.EscrowTransferRepository;
import com.antiscam.ticketing.repository.EventRepository;
import com.antiscam.ticketing.repository.HostProfileRepository;
import com.antiscam.ticketing.repository.UserRepository;
import com.antiscam.ticketing.service.HostKycService;
import com.antiscam.ticketing.service.LedgerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/host")
@PreAuthorize("hasAnyAuthority('ROLE_HOST', 'ROLE_ADMIN')")
public class HostController {

    private final HostKycService hostKycService;
    private final HostProfileRepository hostProfileRepository;
    private final EventRepository eventRepository;
    private final EscrowTransferRepository escrowTransferRepository;
    private final UserRepository userRepository;
    private final SystemSettingsCache settingsCache;
    private final LedgerService ledgerService;

    public HostController(HostKycService hostKycService,
                          HostProfileRepository hostProfileRepository,
                          EventRepository eventRepository,
                          EscrowTransferRepository escrowTransferRepository,
                          UserRepository userRepository,
                          SystemSettingsCache settingsCache,
                          LedgerService ledgerService) {
        this.hostKycService = hostKycService;
        this.hostProfileRepository = hostProfileRepository;
        this.eventRepository = eventRepository;
        this.escrowTransferRepository = escrowTransferRepository;
        this.userRepository = userRepository;
        this.settingsCache = settingsCache;
        this.ledgerService = ledgerService;
    }

    @PostMapping("/kyc")
    public ResponseEntity<ApiResponse<HostProfile>> submitKyc(
            @Valid @RequestBody EscrowDTOs.HostKycRequest request,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        HostProfile profile = hostKycService.submitKyc(user, request);
        return ResponseEntity.ok(ApiResponse.ok("KYC submitted for platform verification", profile));
    }

    @GetMapping("/kyc")
    public ResponseEntity<ApiResponse<HostProfile>> getMyKyc(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        HostProfile profile = hostProfileRepository.findByUserId(user.getId())
                .orElse(null);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @GetMapping("/escrow-breakdown/{eventId}")
    public ResponseEntity<ApiResponse<EscrowDTOs.EscrowBreakdownResponse>> getEscrowBreakdown(
            @PathVariable Long eventId,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        if (!event.getHost().getId().equals(user.getId()) && user.getRole() != Role.ROLE_ADMIN) {
            throw new SecurityException("Unauthorized access to event escrow breakdown");
        }

        EscrowTransfer transfer = escrowTransferRepository.findByEventId(eventId)
                .orElseGet(() -> {
                    EscrowTransfer t = new EscrowTransfer();
                    t.setEvent(event);
                    HostProfile hp = hostProfileRepository.findByUserId(event.getHost().getId()).orElse(null);
                    t.setHostAccountId(hp != null && hp.getRazorpayAccountId() != null ? hp.getRazorpayAccountId() : "acc_sim_pending");
                    t.setGrossAmount(BigDecimal.ZERO);
                    t.setPlatformFeePercent(settingsCache.getPlatformCommissionPercent());
                    t.setPlatformFeeAmount(BigDecimal.ZERO);
                    t.setGatewayFeeAmount(BigDecimal.ZERO);
                    t.setNetPayoutAmount(BigDecimal.ZERO);
                    t.setOnHoldUntil(event.getEscrowReleaseTime());
                    t.setStatus(EscrowStatus.ON_HOLD);
                    return t;
                });

        OffsetDateTime now = OffsetDateTime.now();
        long secondsRemaining = 0;
        if (transfer.getOnHoldUntil().isAfter(now)) {
            secondsRemaining = Duration.between(now, transfer.getOnHoldUntil()).getSeconds();
        }

        EscrowDTOs.EscrowBreakdownResponse resp = new EscrowDTOs.EscrowBreakdownResponse();
        resp.setEventId(event.getId());
        resp.setEventTitle(event.getTitle());
        resp.setHostAccountId(transfer.getHostAccountId());
        resp.setGrossTicketSales(transfer.getGrossAmount());
        resp.setGatewayFeeAmount(transfer.getGatewayFeeAmount());
        resp.setPlatformFeePercent(transfer.getPlatformFeePercent());
        resp.setPlatformFeeAmount(transfer.getPlatformFeeAmount());
        resp.setNetHeldPayout(transfer.getNetPayoutAmount());
        resp.setEscrowStatus(transfer.getStatus());
        resp.setOnHoldUntil(transfer.getOnHoldUntil());
        resp.setSecondsRemainingToRelease(secondsRemaining);
        resp.setCanSelfCancel(event.getStatus() == EventStatus.VERIFIED_LIVE || event.getStatus() == EventStatus.PENDING_VERIFICATION);
        resp.setHostExternalAccountNote("Security Confirmation: Host's personal and business bank accounts are completely untouched. Ticket proceeds remain locked in the multi-sig Escrow Pool until 12 hours after event completion.");

        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    @PostMapping("/cancel-event/{eventId}")
    @Transactional
    public ResponseEntity<ApiResponse<String>> cancelEventAndTriggerRefunds(
            @PathVariable Long eventId,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        if (!event.getHost().getId().equals(user.getId()) && user.getRole() != Role.ROLE_ADMIN) {
            throw new SecurityException("Unauthorized access to cancel event");
        }

        event.setStatus(EventStatus.CANCELED);
        eventRepository.save(event);

        escrowTransferRepository.findByEventId(eventId).ifPresent(transfer -> {
            transfer.setStatus(EscrowStatus.REFUNDED);
            transfer.setDisputeReason("Host initiated self-service event cancellation and bulk attendee refunds");
            escrowTransferRepository.save(transfer);

            // Record cancellation entry in immutable ledger
            ledgerService.recordEntry(
                    "CANCEL_EVT_" + eventId + "_" + System.currentTimeMillis(),
                    "LEDGER_CANCEL_" + eventId + "_" + System.currentTimeMillis(),
                    "ESCROW_POOL_EVENT_" + eventId,
                    "USER_REFUND_POOL",
                    transfer.getGrossAmount(),
                    "INR",
                    LedgerEntryType.AUTO_REFUND,
                    "{\"reason\":\"Host initiated event cancellation\"}"
            );
        });

        return ResponseEntity.ok(ApiResponse.ok("Event canceled successfully. Instant bulk attendee refunds scheduled.", null));
    }
}
