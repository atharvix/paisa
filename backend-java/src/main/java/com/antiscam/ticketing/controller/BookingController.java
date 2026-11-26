package com.antiscam.ticketing.controller;

import com.antiscam.ticketing.dto.ApiResponse;
import com.antiscam.ticketing.dto.CheckoutDTOs;
import com.antiscam.ticketing.entity.User;
import com.antiscam.ticketing.repository.UserRepository;
import com.antiscam.ticketing.service.TicketBookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final TicketBookingService bookingService;
    private final UserRepository userRepository;

    public BookingController(TicketBookingService bookingService, UserRepository userRepository) {
        this.bookingService = bookingService;
        this.userRepository = userRepository;
    }

    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<CheckoutDTOs.OrderInitiateResponse>> initiateBooking(
            @Valid @RequestBody CheckoutDTOs.CheckoutInitiateRequest request,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CheckoutDTOs.OrderInitiateResponse response = bookingService.initiateBooking(user, request);
        return ResponseEntity.ok(ApiResponse.ok("Checkout initiated with escrow hold", response));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<CheckoutDTOs.TicketDetailResponse>> verifyAndIssueTicket(
            @Valid @RequestBody CheckoutDTOs.PaymentVerifyRequest request,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CheckoutDTOs.TicketDetailResponse ticket = bookingService.verifyAndIssueTicket(user, request);
        return ResponseEntity.ok(ApiResponse.ok("Payment verified and signed ticket issued to escrow wallet", ticket));
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<ApiResponse<List<CheckoutDTOs.TicketDetailResponse>>> getUserTickets(
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<CheckoutDTOs.TicketDetailResponse> tickets = bookingService.getUserTickets(user);
        return ResponseEntity.ok(ApiResponse.ok(tickets));
    }

    @GetMapping("/ticket/{id}")
    public ResponseEntity<ApiResponse<CheckoutDTOs.TicketDetailResponse>> getTicketById(
            @PathVariable Long id,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CheckoutDTOs.TicketDetailResponse ticket = bookingService.getTicketById(id, user);
        return ResponseEntity.ok(ApiResponse.ok(ticket));
    }
}
