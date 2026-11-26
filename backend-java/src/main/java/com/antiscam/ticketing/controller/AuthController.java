package com.antiscam.ticketing.controller;

import com.antiscam.ticketing.dto.ApiResponse;
import com.antiscam.ticketing.dto.AuthRequests;
import com.antiscam.ticketing.dto.AuthResponses;
import com.antiscam.ticketing.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponses.AuthResponse>> register(
            @Valid @RequestBody AuthRequests.RegisterRequest request) {
        AuthResponses.AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.ok("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponses.AuthResponse>> login(
            @Valid @RequestBody AuthRequests.LoginRequest request) {
        AuthResponses.AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponses.AuthResponse>> refreshToken(
            @Valid @RequestBody AuthRequests.RefreshRequest request) {
        AuthResponses.AuthResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed successfully", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponses.UserProfileResponse>> getCurrentUser(
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }
        AuthResponses.UserProfileResponse profile = authService.getProfile(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }
}
