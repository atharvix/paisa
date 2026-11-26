package com.antiscam.ticketing.controller;

import com.antiscam.ticketing.dto.ApiResponse;
import com.antiscam.ticketing.dto.EventRequests;
import com.antiscam.ticketing.dto.EventResponses;
import com.antiscam.ticketing.entity.Event;
import com.antiscam.ticketing.entity.User;
import com.antiscam.ticketing.repository.UserRepository;
import com.antiscam.ticketing.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;
    private final UserRepository userRepository;

    public EventController(EventService eventService, UserRepository userRepository) {
        this.eventService = eventService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventResponses.EventDetailResponse>>> getLiveEvents() {
        List<EventResponses.EventDetailResponse> events = eventService.getLiveEvents();
        return ResponseEntity.ok(ApiResponse.ok(events));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventResponses.EventDetailResponse>> getEventDetail(@PathVariable Long id) {
        EventResponses.EventDetailResponse event = eventService.getEventDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(event));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_HOST', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<EventResponses.EventDetailResponse>> createEvent(
            @Valid @RequestBody EventRequests.CreateEventRequest request,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Event created = eventService.createEvent(user, request);
        return ResponseEntity.ok(ApiResponse.ok("Event created and submitted for verification", eventService.mapToDetailResponse(created)));
    }

    @GetMapping("/host/my-events")
    @PreAuthorize("hasAnyAuthority('ROLE_HOST', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<EventResponses.EventDetailResponse>>> getHostEvents(
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<EventResponses.EventDetailResponse> events = eventService.getHostEvents(user);
        return ResponseEntity.ok(ApiResponse.ok(events));
    }
}
