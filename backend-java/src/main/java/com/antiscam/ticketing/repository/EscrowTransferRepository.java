package com.antiscam.ticketing.repository;

import com.antiscam.ticketing.entity.EscrowStatus;
import com.antiscam.ticketing.entity.EscrowTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EscrowTransferRepository extends JpaRepository<EscrowTransfer, Long> {
    Optional<EscrowTransfer> findByEventId(Long eventId);
    List<EscrowTransfer> findByStatus(EscrowStatus status);
}
