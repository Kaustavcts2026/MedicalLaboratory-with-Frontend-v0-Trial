package com.cognizant.auth_service.controller;

import com.cognizant.auth_service.dto.AuthRequest;
import com.cognizant.auth_service.entity.Role;
import com.cognizant.auth_service.entity.Users;
//import org.apache.catalina.User;
import com.cognizant.auth_service.repository.UserRepository;
import com.cognizant.auth_service.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/create-lab-tech")
    public String createLabTech(@RequestBody AuthRequest request, Authentication auth){
        Users user = new Users();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.LAB_TECH);
        userRepository.save(user);

        auditLogService.log(auth.getName(),
                "ADMIN",
                "CREATE-LAB-TECH",
                "/admin/create-lab-tech");
        return "Lab Technician Created";
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/users")
    public List<Users> getAllUsers(){
        return userRepository.findAll();
    }
}
