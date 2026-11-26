package com.antiscam.ticketing.repository;

import com.antiscam.ticketing.entity.HostProfile;
import com.antiscam.ticketing.entity.KycStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HostProfileRepository extends JpaRepository<HostProfile, Long> {
    Optional<HostProfile> findByUserId(Long userId);
    List<HostProfile> findByKycStatus(KycStatus status);
}
