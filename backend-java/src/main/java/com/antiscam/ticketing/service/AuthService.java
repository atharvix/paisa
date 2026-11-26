package com.antiscam.ticketing.service;

import com.antiscam.ticketing.config.JwtService;
import com.antiscam.ticketing.dto.AuthRequests;
import com.antiscam.ticketing.dto.AuthResponses;
import com.antiscam.ticketing.entity.HostProfile;
import com.antiscam.ticketing.entity.KycStatus;
import com.antiscam.ticketing.entity.Role;
import com.antiscam.ticketing.entity.User;
import com.antiscam.ticketing.repository.HostProfileRepository;
import com.antiscam.ticketing.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final HostProfileRepository hostProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       HostProfileRepository hostProfileRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.hostProfileRepository = hostProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponses.AuthResponse register(AuthRequests.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("User with email " + request.getEmail() + " already exists");
        }

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName(),
                request.getPhone(),
                request.getRole() != null ? request.getRole() : Role.ROLE_ATTENDEE
        );
        user = userRepository.save(user);

        if (user.getRole() == Role.ROLE_HOST) {
            HostProfile profile = new HostProfile();
            profile.setUser(user);
            profile.setPanNumber("PENDING");
            profile.setBankAccountNumber("PENDING");
            profile.setBankIfsc("PENDING");
            profile.setBusinessName(user.getFullName() + " Org");
            profile.setBusinessEntityType("INDIVIDUAL");
            profile.setKycStatus(KycStatus.PENDING);
            hostProfileRepository.save(profile);
        }

        return generateAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponses.AuthResponse login(AuthRequests.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new IllegalStateException("Account is deactivated");
        }

        return generateAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponses.AuthResponse refreshToken(String refreshToken) {
        if (jwtService.isTokenExpired(refreshToken)) {
            throw new IllegalArgumentException("Refresh token has expired");
        }
        String email = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return generateAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponses.UserProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String kycStatus = "N/A";
        String razorpayAccountId = null;
        if (user.getRole() == Role.ROLE_HOST) {
            var hostProfile = hostProfileRepository.findByUserId(user.getId());
            if (hostProfile.isPresent()) {
                kycStatus = hostProfile.get().getKycStatus().name();
                razorpayAccountId = hostProfile.get().getRazorpayAccountId();
            }
        }

        return new AuthResponses.UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole(),
                kycStatus,
                razorpayAccountId
        );
    }

    private AuthResponses.AuthResponse generateAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user.getEmail(), user.getId(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail(), user.getId());

        String kycStatus = "N/A";
        String razorpayAccountId = null;
        if (user.getRole() == Role.ROLE_HOST) {
            var hostProfile = hostProfileRepository.findByUserId(user.getId());
            if (hostProfile.isPresent()) {
                kycStatus = hostProfile.get().getKycStatus().name();
                razorpayAccountId = hostProfile.get().getRazorpayAccountId();
            }
        }

        AuthResponses.UserProfileResponse profile = new AuthResponses.UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole(),
                kycStatus,
                razorpayAccountId
        );

        return new AuthResponses.AuthResponse(accessToken, refreshToken, 86400000L, profile);
    }
}
