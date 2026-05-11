package com.cognizant.auth_service.config;

import com.cognizant.auth_service.entity.Role;
import com.cognizant.auth_service.entity.Users;
import com.cognizant.auth_service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Pre-seeds the admin account on every fresh database start.
 * Credentials: username=admin  password=Admin@123
 * Idempotent — does nothing if the account already exists.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername("admin").isPresent()) {
            return; // already seeded — nothing to do
        }
        Users admin = new Users();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("Admin@123"));
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);
    }
}
