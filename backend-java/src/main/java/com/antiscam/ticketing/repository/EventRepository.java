package com.antiscam.ticketing.repository;

import com.antiscam.ticketing.entity.Event;
import com.antiscam.ticketing.entity.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStatus(EventStatus status);
    List<Event> findByHostId(Long hostId);
    List<Event> findByStatusIn(List<EventStatus> statuses);
}
