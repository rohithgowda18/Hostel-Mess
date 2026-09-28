package com.hostel.mess.controller;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.hostel.mess.model.Complaint;
import com.hostel.mess.model.FoodRating;
import com.hostel.mess.service.AdminService;

/**
 * Controller 6: AdminController
 * Domain: Administrative operations (admin dashboard, student management,
 * role promotion/demotion, admin analytics, ratings & complaints management, health check)
 */
@RestController
public class AdminController {

    @Autowired
    private AdminService adminService;

    // Health check endpoint
    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    // ==========================================
    // 1. ADMIN DASHBOARD & USER MANAGEMENT
    // ==========================================

    @GetMapping("/api/admin/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/api/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getUsers(@RequestParam(value = "query", required = false) String query) {
        return ResponseEntity.ok(adminService.getUsers(query));
    }

    @PutMapping("/api/admin/users/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRole(
            @PathVariable String userId,
            @RequestBody Map<String, String> payload) {
        try {
            String role = payload.get("role");
            Map<String, Object> result = adminService.updateUserRole(userId, role);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/admin/ratings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FoodRating>> getRatings() {
        return ResponseEntity.ok(adminService.getRatings());
    }

    @GetMapping("/api/admin/complaints")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Complaint>> getComplaints() {
        return ResponseEntity.ok(adminService.getComplaints());
    }

    // ==========================================
    // 2. ADMIN ANALYTICS & REPORTING
    // ==========================================

    @GetMapping("/api/analytics/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardAnalytics() {
        return ResponseEntity.ok(adminService.getDashboardAnalytics());
    }

    @GetMapping("/api/analytics/occupancy")
    public ResponseEntity<Map<String, Object>> getOccupancyStats() {
        return ResponseEntity.ok(adminService.getOccupancyStats());
    }

    @GetMapping("/api/analytics/kitchen-forecast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getKitchenWasteForecast() {
        return ResponseEntity.ok(adminService.getKitchenWasteForecast());
    }

    @GetMapping("/api/analytics/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportStatsCsv() {
        String csv = adminService.generateCsvExport();
        byte[] bytes = csv.getBytes();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=mess_analytics.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }
}
