package com.cognizant.auth_service.service;

import com.cognizant.auth_service.dto.AuthRequest;
import com.cognizant.auth_service.dto.AuthResponse;
import com.cognizant.auth_service.entity.Role;
import com.cognizant.auth_service.entity.Users;
import com.cognizant.auth_service.repository.UserRepository;
import com.cognizant.auth_service.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public String register(AuthRequest request){

        Users user = new Users();
        String username = request.getUsername().trim();

        if(userRepository.findByUsername(username).isPresent()){
            throw new RuntimeException("Username Already Exists");
        }
        String password = request.getPassword().trim();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));

        user.setRole(Role.PATIENT);
        userRepository.save(user);

        return "User registered successfully";
    }

    public AuthResponse login(AuthRequest request){
        String username = request.getUsername().trim();
        String password = request.getPassword().trim();
        Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

       //System.out.println("re" + request.getPassword() + "us" + user.getPassword());
        if(!passwordEncoder.matches(password, user.getPassword())){
            throw new RuntimeException("Invalid Credentials");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        return new AuthResponse(token);
    }
}
