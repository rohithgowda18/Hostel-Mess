package com.hostel.mess.controller;

import com.hostel.mess.dto.*;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.UserRepository;
import com.hostel.mess.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for authentication endpoints (register/login)
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        // Require email, password
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, "Email is required"));
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, "Password is required"));
        }
        // Unique check
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, "Email already in use"));
        }
        // Hash password
        String hashed = passwordEncoder.encode(request.getPassword());
        User user = new User(
                request.getEmail(),
                hashed,
                request.getHostel(),
                request.getRoomNumber(),
                request.getYear(),
                request.getBranch()
        );
        user.setRole("STUDENT");
        userRepository.save(user);
        // Prepare response
        UserInfo userInfo = new UserInfo(
                user.getId(), user.getEmail(), user.getHostel(),
                user.getRoomNumber(), user.getYear(), user.getBranch(), user.getRole()
        );
        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new LoginResponse(token, userInfo));
    }

        @PostMapping("/login")
        public ResponseEntity<?> login(@RequestBody LoginRequest request) {
                User user = userRepository.findByEmail(request.getEmail()).orElse(null);
                if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                        .body(new ApiResponse(false, "Invalid email or password"));
                }
                UserInfo userInfo = new UserInfo(
                                user.getId(), user.getEmail(), user.getHostel(),
                                user.getRoomNumber(), user.getYear(), user.getBranch(), user.getRole()
                );
                String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
                return ResponseEntity.ok(new LoginResponse(token, userInfo));
        }
}
