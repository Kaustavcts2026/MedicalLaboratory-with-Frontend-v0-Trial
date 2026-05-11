package com.cognizant.auth_service.service;

import com.cognizant.auth_service.entity.AuditLog;
import com.cognizant.auth_service.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public void log(String username, String role, String action, String endpoint){
        AuditLog log = new AuditLog();
        log.setUsername(username);
        log.setRole(role);
        log.setAction(action);
        log.setEndPoint(endpoint);
        log.setTimestamp(LocalDateTime.now());

        auditLogRepository.save(log);
    }
}
