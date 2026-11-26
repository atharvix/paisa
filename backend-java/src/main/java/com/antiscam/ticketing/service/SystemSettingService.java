package com.antiscam.ticketing.service;

import com.antiscam.ticketing.dto.EscrowDTOs;
import com.antiscam.ticketing.entity.SystemSetting;
import com.antiscam.ticketing.repository.SystemSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class SystemSettingService {

    private final SystemSettingRepository settingRepository;

    public SystemSettingService(SystemSettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    @Transactional(readOnly = true)
    public List<SystemSetting> getAllSettings() {
        return settingRepository.findAll();
    }

    @Transactional
    public SystemSetting updateSetting(EscrowDTOs.SystemSettingUpdateDTO updateDto, String updatedBy) {
        SystemSetting setting = settingRepository.findById(updateDto.getKey())
                .orElseGet(() -> new SystemSetting(updateDto.getKey(), updateDto.getValue(), updateDto.getDescription(), updatedBy));

        setting.setSettingValue(updateDto.getValue());
        if (updateDto.getDescription() != null) {
            setting.setDescription(updateDto.getDescription());
        }
        setting.setUpdatedBy(updatedBy != null ? updatedBy : "ADMIN");
        setting.setUpdatedAt(OffsetDateTime.now());

        return settingRepository.save(setting);
    }
}
