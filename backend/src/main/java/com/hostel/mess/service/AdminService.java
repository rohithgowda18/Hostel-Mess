package com.hostel.mess.service;

import com.hostel.mess.dto.AdminLoginRequest;
import com.hostel.mess.dto.AdminLoginResponse;
import com.hostel.mess.model.Admin;
import com.hostel.mess.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AdminService {
    
    @Autowired
    private AdminRepository adminRepository;
    
    // Simple token generation (In production, use JWT)
    private String generateToken(String adminId) {
        return Base64.getEncoder().encodeToString(
            (adminId + ":" + System.currentTimeMillis()).getBytes()
        );
    }
    
    /**
     * Admin login
     */
    public AdminLoginResponse login(AdminLoginRequest request) {
        Optional<Admin> admin = adminRepository.findByUsername(request.getUsername());
        
        if (!admin.isPresent()) {
            throw new RuntimeException("Admin not found");
        }
        
        Admin foundAdmin = admin.get();
        
        // Simple password check (In production, use bcrypt)
        if (!foundAdmin.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        
        if (!foundAdmin.isActive()) {
            throw new RuntimeException("Admin account is inactive");
        }
        
        // Update last login
        foundAdmin.setLastLogin(Instant.now());
        adminRepository.save(foundAdmin);
        
        // Generate token
        String token = generateToken(foundAdmin.getId());
        
        return new AdminLoginResponse(
            foundAdmin.getId(),
            foundAdmin.getUsername(),
            foundAdmin.getFullName(),
            foundAdmin.getRole(),
            token
        );
    }
    
    /**
     * Create a new admin (only for super admin)
     */
    public Admin createAdmin(Admin newAdmin) {
        Optional<Admin> existingByUsername = adminRepository.findByUsername(newAdmin.getUsername());
        if (existingByUsername.isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        
        Optional<Admin> existingByEmail = adminRepository.findByEmail(newAdmin.getEmail());
        if (existingByEmail.isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        
        newAdmin.setCreatedAt(Instant.now());
        newAdmin.setActive(true);
        return adminRepository.save(newAdmin);
    }
    
    /**
     * Get all admins
     */
    public List<Admin> getAllAdmins() {
        return adminRepository.findAll();
    }
    
    /**
     * Verify admin token
     */
    public Optional<Admin> verifyToken(String token) {
        try {
            String decoded = new String(Base64.getDecoder().decode(token));
            String adminId = decoded.split(":")[0];
            return adminRepository.findById(adminId);
        } catch (Exception e) {
            return Optional.empty();
        }
    }
    
    /**
     * Get admin by ID
     */
    public Optional<Admin> getAdminById(String id) {
        return adminRepository.findById(id);
    }
    
    /**
     * Update admin
     */
    public Admin updateAdmin(String id, Admin updatedAdmin) {
        Optional<Admin> existing = adminRepository.findById(id);
        if (!existing.isPresent()) {
            throw new RuntimeException("Admin not found");
        }
        
        Admin admin = existing.get();
        if (updatedAdmin.getFullName() != null) {
            admin.setFullName(updatedAdmin.getFullName());
        }
        if (updatedAdmin.getEmail() != null) {
            admin.setEmail(updatedAdmin.getEmail());
        }
        if (updatedAdmin.getPassword() != null) {
            admin.setPassword(updatedAdmin.getPassword());
        }
        
        return adminRepository.save(admin);
    }
    
    /**
     * Deactivate admin
     */
    public void deactivateAdmin(String id) {
        Optional<Admin> admin = adminRepository.findById(id);
        if (admin.isPresent()) {
            admin.get().setActive(false);
            adminRepository.save(admin.get());
        }
    }
}
