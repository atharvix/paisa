package com.antiscam.ticketing.controller;

import com.antiscam.ticketing.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> status = Map.of(
                "service", "Anti-Scam Event Ticketing Core Financial & RBAC Service",
                "status", "UP",
                "database", "PostgreSQL 16",
                "concurrencyProtection", "Pessimistic DB Row Locking (Zero Overselling)",
                "financialEngine", "Double-Entry Immutable Audit Ledger",
                "timestamp", System.currentTimeMillis()
        );
        return ResponseEntity.ok(ApiResponse.ok(status));
    }
}
