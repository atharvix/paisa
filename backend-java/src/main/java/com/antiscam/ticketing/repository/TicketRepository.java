package com.antiscam.ticketing.repository;

import com.antiscam.ticketing.entity.Ticket;
import com.antiscam.ticketing.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByUserId(Long userId);
    List<Ticket> findByEventId(Long eventId);
    Optional<Ticket> findByTicketNumber(String ticketNumber);
    Optional<Ticket> findByIdempotencyKey(String idempotencyKey);
    long countByEventId(Long eventId);
    long countByEventIdAndStatus(Long eventId, TicketStatus status);
}
