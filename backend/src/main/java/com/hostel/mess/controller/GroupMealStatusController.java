package com.hostel.mess.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hostel.mess.dto.GroupMealStatusResponse;
import com.hostel.mess.model.Group;
import com.hostel.mess.model.GroupMealStatus;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.UserRepository;
import com.hostel.mess.service.GroupMealStatusService;

@RestController
@RequestMapping("/api/group-meal-status")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "https://rohithgowda18.github.io", "https://hostel-mess-one.vercel.app"})
public class GroupMealStatusController {
    
    @Autowired
    private GroupMealStatusService groupMealStatusService;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * POST /api/group-meal-status/going
     * Mark user as going to a meal (requires authentication)
     * Body: { "groupId": "group123", "mealType": "DINNER" }
     */
    @PostMapping("/going")
    public ResponseEntity<?> markUserGoing(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> payload) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
            }
            
            // Get user email from database
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
            String userEmail = user.getEmail();
            
            String groupId = payload.get("groupId");
            String mealType = payload.get("mealType");
            
            if (groupId == null || groupId.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Group ID is required"));
            }
            
            if (mealType == null || mealType.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Meal type is required"));
            }
            
            // Use userId (MongoDB ID) for meal status, but email for member check
            GroupMealStatus status = groupMealStatusService.markUserGoing(groupId, mealType, userId, userEmail);
            return ResponseEntity.ok(convertToResponse(status));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * DELETE /api/group-meal-status/{groupId}/{mealType}
     * Cancel user's going status (requires authentication)
     */
    @DeleteMapping("/{groupId}/{mealType}")
    public ResponseEntity<?> cancelUserGoing(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String groupId,
            @PathVariable String mealType) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
            }
            
            GroupMealStatus status = groupMealStatusService.cancelUserGoing(groupId, mealType, userId);
            return ResponseEntity.ok(convertToResponse(status));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * GET /api/group-meal-status/{groupId}/{mealType}
     * Get group meal status
     */
    @GetMapping("/{groupId}/{mealType}")
    public ResponseEntity<?> getGroupMealStatus(
            @PathVariable String groupId,
            @PathVariable String mealType) {
        try {
            GroupMealStatus status = groupMealStatusService.getGroupMealStatus(groupId, mealType);
            return ResponseEntity.ok(convertToResponse(status));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    // Helper method to convert GroupMealStatus to Response
    private GroupMealStatusResponse convertToResponse(GroupMealStatus status) {
        return new GroupMealStatusResponse(
            status.getGroupId(),
            status.getMealType(),
            status.getGoingUsers(),
            status.getUpdatedAt(),
            status.getExpiresAt()
        );
    }
}
