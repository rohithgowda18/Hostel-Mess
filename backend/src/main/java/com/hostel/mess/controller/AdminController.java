package com.hostel.mess.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hostel.mess.dto.AdminLoginRequest;
import com.hostel.mess.dto.AdminLoginResponse;
import com.hostel.mess.model.Admin;
import com.hostel.mess.service.AdminService;
import com.hostel.mess.service.ComplaintService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    
    @Autowired
    private AdminService adminService;
    
    @Autowired
    private ComplaintService complaintService;
    
    /**
     * Admin login endpoint
     * POST /api/admin/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AdminLoginRequest request) {
        try {
            AdminLoginResponse response = adminService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }
    
    /**
     * Get admin dashboard stats
     * GET /api/admin/dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(@RequestHeader("Authorization") String token) {
        try {
            var admin = adminService.verifyToken(token);
            if (!admin.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Invalid or expired token"));
            }
            
            // Get complaints statistics
            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("adminName", admin.get().getFullName());
            dashboard.put("adminRole", admin.get().getRole());
            
            // Add complaint stats from ComplaintService
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error fetching dashboard: " + e.getMessage()));
        }
    }
    
    /**
     * Get all admins (only for super admin)
     * GET /api/admin/all
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllAdmins(@RequestHeader("Authorization") String token) {
        try {
            var admin = adminService.verifyToken(token);
            if (!admin.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Unauthorized"));
            }
            
            if (!"SUPER_ADMIN".equals(admin.get().getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("Only super admins can view all admins"));
            }
            
            List<Admin> admins = adminService.getAllAdmins();
            return ResponseEntity.ok(admins);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Create new admin (only for super admin)
     * POST /api/admin/create
     */
    @PostMapping("/create")
    public ResponseEntity<?> createAdmin(
        @RequestHeader("Authorization") String token,
        @RequestBody Admin newAdmin) {
        try {
            var admin = adminService.verifyToken(token);
            if (!admin.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Unauthorized"));
            }
            
            if (!"SUPER_ADMIN".equals(admin.get().getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("Only super admins can create new admins"));
            }
            
            Admin created = adminService.createAdmin(newAdmin);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(createErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Get admin profile
     * GET /api/admin/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String token) {
        try {
            var admin = adminService.verifyToken(token);
            if (!admin.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Invalid or expired token"));
            }
            
            return ResponseEntity.ok(admin.get());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Update admin profile
     * PUT /api/admin/profile
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
        @RequestHeader("Authorization") String token,
        @RequestBody Admin updatedAdmin) {
        try {
            var admin = adminService.verifyToken(token);
            if (!admin.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Unauthorized"));
            }
            
            Admin result = adminService.updateAdmin(admin.get().getId(), updatedAdmin);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(createErrorResponse(e.getMessage()));
        }
    }
    
    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}
