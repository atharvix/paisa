package com.antiscam.ticketing.dto;

import com.antiscam.ticketing.entity.Role;

public class AuthResponses {

    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private Long expiresInMs;
        private UserProfileResponse user;

        public AuthResponse() {}

        public AuthResponse(String accessToken, String refreshToken, Long expiresInMs, UserProfileResponse user) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.expiresInMs = expiresInMs;
            this.user = user;
        }

        public String getAccessToken() { return accessToken; }
        public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
        public String getRefreshToken() { return refreshToken; }
        public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
        public String getTokenType() { return tokenType; }
        public Long getExpiresInMs() { return expiresInMs; }
        public void setExpiresInMs(Long expiresInMs) { this.expiresInMs = expiresInMs; }
        public UserProfileResponse getUser() { return user; }
        public void setUser(UserProfileResponse user) { this.user = user; }
    }

    public static class UserProfileResponse {
        private Long id;
        private String email;
        private String fullName;
        private String phone;
        private Role role;
        private String kycStatus;
        private String razorpayAccountId;

        public UserProfileResponse() {}

        public UserProfileResponse(Long id, String email, String fullName, String phone, Role role, String kycStatus, String razorpayAccountId) {
            this.id = id;
            this.email = email;
            this.fullName = fullName;
            this.phone = phone;
            this.role = role;
            this.kycStatus = kycStatus;
            this.razorpayAccountId = razorpayAccountId;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public Role getRole() { return role; }
        public void setRole(Role role) { this.role = role; }
        public String getKycStatus() { return kycStatus; }
        public void setKycStatus(String kycStatus) { this.kycStatus = kycStatus; }
        public String getRazorpayAccountId() { return razorpayAccountId; }
        public void setRazorpayAccountId(String razorpayAccountId) { this.razorpayAccountId = razorpayAccountId; }
    }
}
