package com.antiscam.ticketing.service;

import com.antiscam.ticketing.dto.EscrowDTOs;
import com.antiscam.ticketing.entity.HostProfile;
import com.antiscam.ticketing.entity.KycStatus;
import com.antiscam.ticketing.entity.User;
import com.antiscam.ticketing.repository.HostProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HostKycService {

    private final HostProfileRepository hostProfileRepository;
    private final RazorpayRouteService razorpayRouteService;

    public HostKycService(HostProfileRepository hostProfileRepository,
                          RazorpayRouteService razorpayRouteService) {
        this.hostProfileRepository = hostProfileRepository;
        this.razorpayRouteService = razorpayRouteService;
    }

    @Transactional
    public HostProfile submitKyc(User hostUser, EscrowDTOs.HostKycRequest request) {
        HostProfile profile = hostProfileRepository.findByUserId(hostUser.getId())
                .orElseGet(() -> {
                    HostProfile p = new HostProfile();
                    p.setUser(hostUser);
                    return p;
                });

        profile.setPanNumber(request.getPanNumber());
        profile.setBankAccountNumber(request.getBankAccountNumber());
        profile.setBankIfsc(request.getBankIfsc());
        profile.setBusinessName(request.getBusinessName());
        profile.setBusinessEntityType(request.getBusinessEntityType());
        profile.setKycDocumentUrl(request.getKycDocumentUrl());
        profile.setKycStatus(KycStatus.PENDING);
        profile.setRejectionReason(null);

        // Generate / link Razorpay Route account ID
        String razorpayAccountId = razorpayRouteService.createLinkedAccount(
                request.getBusinessName(),
                request.getPanNumber(),
                request.getBankAccountNumber(),
                request.getBankIfsc()
        );
        profile.setRazorpayAccountId(razorpayAccountId);

        return hostProfileRepository.save(profile);
    }

    @Transactional(readOnly = true)
    public List<HostProfile> getPendingKycQueue() {
        return hostProfileRepository.findByKycStatus(KycStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public HostProfile getHostProfile(Long userId) {
        return hostProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Host profile not found"));
    }

    @Transactional
    public HostProfile verifyKyc(Long hostProfileId, boolean approve, String rejectionReason) {
        HostProfile profile = hostProfileRepository.findById(hostProfileId)
                .orElseThrow(() -> new IllegalArgumentException("Host profile not found"));

        if (approve) {
            profile.setKycStatus(KycStatus.VERIFIED);
            profile.setRejectionReason(null);
        } else {
            profile.setKycStatus(KycStatus.REJECTED);
            profile.setRejectionReason(rejectionReason);
        }

        return hostProfileRepository.save(profile);
    }
}
