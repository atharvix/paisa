package com.antiscam.ticketing.repository;

import com.antiscam.ticketing.entity.WebhookLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WebhookLogRepository extends JpaRepository<WebhookLog, Long> {
}
