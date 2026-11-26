package com.antiscam.ticketing.repository;

import com.antiscam.ticketing.entity.VenueDispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VenueDisputeRepository extends JpaRepository<VenueDispute, Long> {
    List<VenueDispute> findByEventId(Long eventId);
    long countByEventId(Long eventId);
    List<VenueDispute> findAllByOrderByCreatedAtDesc();
}
