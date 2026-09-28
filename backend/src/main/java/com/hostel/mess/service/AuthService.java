package com.hostel.mess.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.hostel.mess.dto.LoginRequest;
import com.hostel.mess.dto.LoginResponse;
import com.hostel.mess.dto.RegisterRequest;
import com.hostel.mess.dto.UserInfo;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.UserRepository;
import com.hostel.mess.security.JwtService;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    public LoginResponse register(RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("Email already in use");
        }

        String email = request.getEmail().trim().toLowerCase();
        String hashed = passwordEncoder.encode(request.getPassword());
        User user = new User(
                email,
                hashed,
                request.getHostel(),
                request.getRoomNumber(),
                request.getYear(),
                request.getBranch()
        );
        // Security rule: Registration always assigns STUDENT. Admin accounts must be bootstrapped or promoted.
        user.setRole("STUDENT");
        userRepository.save(user);

        UserInfo userInfo = new UserInfo(
                user.getId(), user.getEmail(), user.getHostel(),
                user.getRoomNumber(), user.getYear(), user.getBranch(), user.getRole(),
                user.getFloor(), user.getDirectoryVisible(), user.getPhoneNumber(), user.getProfilePhoto(), user.getFavoriteFoods()
        );
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());
        return new LoginResponse(token, userInfo);
    }

    public LoginResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            throw new IllegalArgumentException("Email and password are required");
        }
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        UserInfo userInfo = new UserInfo(
                user.getId(), user.getEmail(), user.getHostel(),
                user.getRoomNumber(), user.getYear(), user.getBranch(), user.getRole(),
                user.getFloor(), user.getDirectoryVisible(), user.getPhoneNumber(), user.getProfilePhoto(), user.getFavoriteFoods()
        );
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());
        return new LoginResponse(token, userInfo);
    }
}
