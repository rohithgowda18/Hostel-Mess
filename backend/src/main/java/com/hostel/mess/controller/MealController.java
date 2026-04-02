package com.hostel.mess.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hostel.mess.dto.MealRequest;
import com.hostel.mess.dto.MealResponse;
import com.hostel.mess.service.AdminService;
import com.hostel.mess.service.MealService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/meals")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "https://rohithgowda18.github.io", "https://hostel-mess-one.vercel.app"})
public class MealController {

    @Autowired
    private MealService mealService;
    
    @Autowired
    private AdminService adminService;

    /**
     * GET /api/meals/today/{mealType}
     * Fetch today's food for given meal type
     */
    @GetMapping("/today/{mealType}")
    public ResponseEntity<MealResponse> getTodayMeal(@PathVariable String mealType) {
        MealResponse response = mealService.getTodayMeal(mealType);
        if (response == null) {
            return ResponseEntity.ok(null);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/meals/update
     * Save today's food for a meal (requires authentication)
     */
    @PostMapping("/update")
    public ResponseEntity<?> updateMeal(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody MealRequest request) {
        String userId = userDetails != null ? userDetails.getUsername() : null;
        if (userId == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Unauthorized", "message", "Authentication required"));
        }
        MealResponse response = mealService.updateMeal(request);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/meals/admin/{mealType}/today
     * Admin only: Delete today's menu for a meal type
     */
    @DeleteMapping("/admin/{mealType}/today")
    public ResponseEntity<?> deleteTodayMenuAdmin(
            @PathVariable String mealType,
            @RequestHeader("Authorization") String token) {
        
        // Verify admin token
        var admin = adminService.verifyToken(token);
        if (admin.isEmpty()) {
            return ResponseEntity.status(401).body(
                Map.of("error", "Unauthorized", "message", "Invalid or missing admin token"));
        }
        
        // Delete the meal
        boolean deleted = mealService.deleteTodayMeal(mealType);
        
        if (deleted) {
            return ResponseEntity.ok(
                Map.of("success", true, "message", "Today's " + mealType + " menu deleted successfully"));
        } else {
            return ResponseEntity.status(404).body(
                Map.of("success", false, "message", "No menu found for " + mealType + " today"));
        }
    }
}
