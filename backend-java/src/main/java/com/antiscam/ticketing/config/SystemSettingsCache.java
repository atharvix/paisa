package com.antiscam.ticketing.config;

import com.antiscam.ticketing.entity.SystemSetting;
import com.antiscam.ticketing.repository.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Optional;

@Component
public class SystemSettingsCache {

    private final SystemSettingRepository settingRepository;

    @Value("${app.defaults.platform-commission-percent:10.0}")
    private BigDecimal defaultPlatformCommission;

    @Value("${app.defaults.escrow-hold-duration-seconds:43200}")
    private Long defaultEscrowHoldSeconds;

    @Value("${app.defaults.geofence-radius-meters:300.0}")
    private Double defaultGeofenceRadius;

    @Value("${app.defaults.gps-accuracy-ceiling-meters:150.0}")
    private Double defaultGpsAccuracyCeiling;

    @Value("${app.defaults.dispute-threshold-ratio:0.25}")
    private Double defaultDisputeThresholdRatio;

    @Value("${app.defaults.min-dispute-reporters:3}")
    private Integer defaultMinDisputeReporters;

    @Value("${app.defaults.max-checkin-ratio-for-dispute:0.30}")
    private Double defaultMaxCheckinRatio;

    public SystemSettingsCache(SystemSettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    public BigDecimal getPlatformCommissionPercent() {
        return getBigDecimal("PLATFORM_COMMISSION_PERCENT", defaultPlatformCommission);
    }

    public Long getEscrowHoldDurationSeconds() {
        return getLong("ESCROW_HOLD_DURATION_SECONDS", defaultEscrowHoldSeconds);
    }

    public Double getGeofenceRadiusMeters() {
        return getDouble("GEOFENCE_RADIUS_METERS", defaultGeofenceRadius);
    }

    public Double getGpsAccuracyCeilingMeters() {
        return getDouble("GPS_ACCURACY_CEILING_METERS", defaultGpsAccuracyCeiling);
    }

    public Double getDisputeThresholdRatio() {
        return getDouble("DISPUTE_FREEZE_THRESHOLD_RATIO", defaultDisputeThresholdRatio);
    }

    public Integer getMinDisputeReporters() {
        return getInteger("MIN_DISPUTE_REPORTERS", defaultMinDisputeReporters);
    }

    public Double getMaxCheckinRatioForDispute() {
        return getDouble("MAX_CHECKIN_RATIO_FOR_DISPUTE", defaultMaxCheckinRatio);
    }

    private BigDecimal getBigDecimal(String key, BigDecimal fallback) {
        Optional<SystemSetting> s = settingRepository.findById(key);
        if (s.isPresent()) {
            try { return new BigDecimal(s.get().getSettingValue()); } catch (Exception ignored) {}
        }
        return fallback;
    }

    private Long getLong(String key, Long fallback) {
        Optional<SystemSetting> s = settingRepository.findById(key);
        if (s.isPresent()) {
            try { return Long.parseLong(s.get().getSettingValue()); } catch (Exception ignored) {}
        }
        return fallback;
    }

    private Double getDouble(String key, Double fallback) {
        Optional<SystemSetting> s = settingRepository.findById(key);
        if (s.isPresent()) {
            try { return Double.parseDouble(s.get().getSettingValue()); } catch (Exception ignored) {}
        }
        return fallback;
    }

    private Integer getInteger(String key, Integer fallback) {
        Optional<SystemSetting> s = settingRepository.findById(key);
        if (s.isPresent()) {
            try { return Integer.parseInt(s.get().getSettingValue()); } catch (Exception ignored) {}
        }
        return fallback;
    }
}
