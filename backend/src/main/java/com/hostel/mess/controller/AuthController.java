package com.hostel.mess.controller;

import com.hostel.mess.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for authentication endpoints - Disabled
 * All authentication has been removed. This controller is deprecated.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /**
     * Placeholder - Authentication disabled
     */
    @PostMapping("/register")
    public ResponseEntity<?> register() {
        return ResponseEntity.status(HttpStatus.GONE)
                .body(new ApiResponse(false, "Authentication has been disabled"));
    }

    /**
     * Placeholder - Authentication disabled
     */
    @PostMapping("/login")
    public ResponseEntity<?> login() {
        return ResponseEntity.status(HttpStatus.GONE)
                .body(new ApiResponse(false, "Authentication has been disabled"));
    }
}
