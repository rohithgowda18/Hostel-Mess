package com.hostel.mess.service;

import com.hostel.mess.dto.LoginRequest;
import com.hostel.mess.dto.LoginResponse;
import com.hostel.mess.dto.RegisterRequest;
import com.hostel.mess.dto.UserInfo;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.UserRepository;
import com.hostel.mess.events.UserRegisteredEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for authentication operations
 */
@Service
public class AuthService {
    
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    
    public AuthService(UserRepository userRepository, ApplicationEventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }
    
    /**
     * Register a new user
     * Publishes UserRegisteredEvent after successful registration
     * 
     * @param registerRequest Registration data
     * @return LoginResponse with token and user info
     * @throws RuntimeException if email already exists
     */
    @Transactional
    public LoginResponse register(RegisterRequest registerRequest) {
        // TODO: Implement actual registration logic
        // Placeholder implementation:
        // 1. Check if email exists
        // 2. Create new User
        // 3. Hash password
        // 4. Save to repository
        // 5. Generate JWT token
        // 6. Publish UserRegisteredEvent (after transaction commits)
        // 7. Return LoginResponse
        
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
