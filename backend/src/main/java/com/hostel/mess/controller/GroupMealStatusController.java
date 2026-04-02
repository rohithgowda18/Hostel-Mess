package com.hostel.mess.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hostel.mess.dto.GroupMealStatusResponse;
import com.hostel.mess.model.GroupMealStatus;
import com.hostel.mess.service.GroupMealStatusService;

@RestController
@RequestMapping("/api/group-meal-status")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "https://rohithgowda18.github.io", "https://hostel-mess-one.vercel.app"})
public class GroupMealStatusController {
    
    @Autowired
    private GroupMealStatusService groupMealStatusService;
    
    /**
     * POST /api/group-meal-status/going
     * Mark user as going to a meal
     * Body: { "groupId": "group123", "mealType": "DINNER", "userId": "user123" }
     */
    @PostMapping("/going")
    public ResponseEntity<?> markUserGoing(@RequestBody Map<String, String> payload) {
        try {
            String groupId = payload.get("groupId");
            String mealType = payload.get("mealType");
            String userId = payload.get("userId");
            
            if (groupId == null || groupId.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Group ID is required"));
            }
            
            if (mealType == null || mealType.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Meal type is required"));
            }
            
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "User ID is required"));
            }
            
            GroupMealStatus status = groupMealStatusService.markUserGoing(groupId, mealType, userId);
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
     * DELETE /api/group-meal-status/{groupId}/{mealType}/{userId}
     * Cancel user's going status
     */
    @DeleteMapping("/{groupId}/{mealType}/{userId}")
    public ResponseEntity<?> cancelUserGoing(
            @PathVariable String groupId,
            @PathVariable String mealType,
            @PathVariable String userId) {
        try {
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
