package com.antiscam.ticketing.controller;

import com.antiscam.ticketing.dto.ApiResponse;
import com.antiscam.ticketing.entity.WebhookLog;
import com.antiscam.ticketing.repository.WebhookLogRepository;
import com.antiscam.ticketing.service.RazorpayRouteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    private final RazorpayRouteService razorpayRouteService;
    private final WebhookLogRepository webhookLogRepository;

    public WebhookController(RazorpayRouteService razorpayRouteService,
                             WebhookLogRepository webhookLogRepository) {
        this.razorpayRouteService = razorpayRouteService;
        this.webhookLogRepository = webhookLogRepository;
    }

    @PostMapping("/razorpay")
    public ResponseEntity<ApiResponse<String>> handleRazorpayWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signatureHeader,
            @RequestHeader(value = "X-Razorpay-Event-Id", required = false) String eventIdHeader) {

        log.info("Received Razorpay Webhook: EventIdHeader={}, SignaturePresent={}",
                eventIdHeader, signatureHeader != null);

        boolean isVerified = false;
        if (signatureHeader != null) {
            isVerified = razorpayRouteService.verifyWebhookSignature(rawPayload, signatureHeader);
        }

        WebhookLog webhookLog = new WebhookLog();
        webhookLog.setEventIdHeader(eventIdHeader);
        webhookLog.setEventType("payment_or_transfer_event");
        webhookLog.setPayload(rawPayload);
        webhookLog.setSignature(signatureHeader != null ? signatureHeader : "NONE");
        webhookLog.setIsVerified(isVerified);
        webhookLog.setProcessingStatus(isVerified ? "PROCESSED" : "FAILED");
        webhookLogRepository.save(webhookLog);

        if (!isVerified) {
            log.warn("Rejected unauthorized Razorpay webhook: Signature mismatch");
            return ResponseEntity.status(401).body(ApiResponse.error("Invalid webhook HMAC signature"));
        }

        return ResponseEntity.ok(ApiResponse.ok("Webhook processed and verified", "OK"));
    }
}
