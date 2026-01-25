package com.hostel.mess.service;

import com.hostel.mess.dto.LoginRequest;
import com.hostel.mess.dto.LoginResponse;
import com.hostel.mess.dto.RegisterRequest;
import com.hostel.mess.dto.UserInfo;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.UserRepository;
import org.springframework.stereotype.Service;

/**
 * Service for authentication operations
 */
@Service
public class AuthService {
    
    private final UserRepository userRepository;
    
    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    /**
     * Register a new user - Disabled
     * @param registerRequest Registration data
     * @return LoginResponse with token and user info
     * @throws RuntimeException if email already exists
     */
    public LoginResponse register(RegisterRequest registerRequest) {
        throw new RuntimeException("Registration is disabled");
    }
    
    /**
     * Login user with email and password - Disabled
     * @param loginRequest Login credentials
     * @return LoginResponse with token and user info
     * @throws RuntimeException if credentials are invalid
     */
    public LoginResponse login(LoginRequest loginRequest) {
        throw new RuntimeException("Login is disabled");
    }
    
    /**
     * Get user by ID
     * @param userId User ID
     * @return User object
     */
    public User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    /**
     * Get user info by ID (without password)
     * @param userId User ID
     * @return UserInfo object
     */
    public UserInfo getUserInfoById(String userId) {
        User user = getUserById(userId);
        return new UserInfo(
            user.getId(),
            user.getEmail(),
            user.getHostel(),
            user.getRoomNumber(),
            user.getYear(),
            user.getBranch(),
            user.getRole()
        );
    }
}
