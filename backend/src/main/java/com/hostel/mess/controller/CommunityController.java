package com.hostel.mess.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.hostel.mess.dto.ChatRequest;
import com.hostel.mess.dto.ChatResponse;
import com.hostel.mess.dto.ComplaintRequest;
import com.hostel.mess.dto.ComplaintResponse;
import com.hostel.mess.dto.GroupMealStatusResponse;
import com.hostel.mess.dto.GroupResponse;
import com.hostel.mess.model.FoodRating;
import com.hostel.mess.model.Group;
import com.hostel.mess.model.GroupMealStatus;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.UserRepository;
import com.hostel.mess.service.CommunityService;

/**
 * Controller 4: CommunityController
 * Domain: Community & Social (Food Ratings, Complaints, Groups, Meal Going Coordination, Chat)
 */
@RestController
public class CommunityController {

    @Autowired
    private CommunityService communityService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findById(userDetails.getUsername()).orElse(null);
    }

    // ==========================================
    // 1. FOOD RATINGS
    // ==========================================

    @PostMapping("/api/ratings")
    public ResponseEntity<?> submitRating(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody FoodRating rating) {
        User user = getAuthenticatedUser(userDetails);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        rating.setUserId(user.getId());
        rating.setUserEmail(user.getEmail());
        FoodRating saved = communityService.saveOrUpdateRating(rating);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/api/ratings/{mealType}/{date}")
    public ResponseEntity<?> getRatings(
            @PathVariable String mealType,
            @PathVariable String date) {
        return ResponseEntity.ok(communityService.getMealRatings(mealType.toUpperCase(), date));
    }

    @GetMapping("/api/ratings/my-rating/{mealType}/{date}")
    public ResponseEntity<?> getMyRating(
            @PathVariable String mealType,
            @PathVariable String date,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        FoodRating r = communityService.getUserRating(user.getEmail(), mealType.toUpperCase(), date);
        return ResponseEntity.ok(r);
    }

    @GetMapping("/api/meals/ratings/summary")
    public ResponseEntity<?> getRatingsSummary(
            @RequestParam String mealType,
            @RequestParam String date) {
        return ResponseEntity.ok(communityService.getMealRatingsSummary(mealType.toUpperCase(), date));
    }

    @GetMapping("/api/meals/ratings/user")
    public ResponseEntity<?> getUserRatingSummary(
            @RequestParam String mealType,
            @RequestParam String date,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        FoodRating r = communityService.getUserRating(user.getEmail(), mealType.toUpperCase(), date);
        return ResponseEntity.ok(r);
    }

    // ==========================================
    // 2. COMPLAINTS
    // ==========================================

    @PostMapping("/api/complaints")
    public ResponseEntity<?> raiseComplaint(@RequestBody ComplaintRequest request) {
        try {
            if (request.getMealType() == null || request.getMealType().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Meal type is required"));
            }
            if (request.getFoodItem() == null || request.getFoodItem().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Food item is required"));
            }
            ComplaintResponse response = communityService.raiseComplaint(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error raising complaint: " + e.getMessage()));
        }
    }

    @GetMapping("/api/complaints/today/{mealType}")
    public ResponseEntity<?> getComplaintsToday(@PathVariable String mealType) {
        try {
            List<ComplaintResponse> list = communityService.getComplaintsByMealToday(mealType.toUpperCase());
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching complaints: " + e.getMessage()));
        }
    }

    @PostMapping("/api/complaints/vote")
    public ResponseEntity<?> voteOnComplaint(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String complaintId = payload.get("complaintId");
            String vote = payload.get("vote");
            String userId = userDetails != null ? userDetails.getUsername() : null;

            if (complaintId == null || complaintId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Complaint ID is required"));
            }
            if (vote == null || (!vote.equalsIgnoreCase("AGREE") && !vote.equalsIgnoreCase("DISAGREE"))) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vote must be AGREE or DISAGREE"));
            }
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required to vote"));
            }

            ComplaintResponse response = communityService.voteOnComplaint(complaintId, vote, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // 3. GROUPS
    // ==========================================

    @PostMapping("/api/groups/create")
    public ResponseEntity<?> createGroup(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> payload) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }
            String name = payload.get("name");
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Group name is required"));
            }

            Group group = communityService.createGroup(name, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(new GroupResponse(group));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/api/groups/join")
    public ResponseEntity<?> joinGroup(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> payload) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }
            String groupCode = payload.get("groupCode");
            if (groupCode == null || groupCode.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Group code is required"));
            }

            Group group = communityService.joinGroup(groupCode, userId);
            return ResponseEntity.ok(new GroupResponse(group));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/groups/my-groups")
    public ResponseEntity<?> getMyGroups(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }
            List<Group> groups = communityService.getUserGroups(userId);
            List<GroupResponse> resp = groups.stream().map(GroupResponse::new).toList();
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/groups/{groupId}")
    public ResponseEntity<?> getGroupDetails(@PathVariable String groupId) {
        try {
            Group group = communityService.getGroupDetails(groupId);
            return ResponseEntity.ok(new GroupResponse(group));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/api/groups/{groupId}/leave")
    public ResponseEntity<?> leaveGroup(
            @PathVariable String groupId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }
            communityService.leaveGroup(groupId, userId);
            return ResponseEntity.ok(Map.of("message", "Successfully left group"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/api/groups/{groupId}/members/{memberEmailOrId}")
    public ResponseEntity<?> removeMember(
            @PathVariable String groupId,
            @PathVariable String memberEmailOrId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }
            communityService.removeMember(groupId, memberEmailOrId, userId);
            return ResponseEntity.ok(Map.of("message", "Member removed successfully"));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/api/groups/{groupId}")
    public ResponseEntity<?> deleteGroup(
            @PathVariable String groupId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }
            communityService.deleteGroup(groupId, userId);
            return ResponseEntity.ok(Map.of("message", "Group deleted successfully"));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // 4. GROUP MEAL STATUS
    // ==========================================

    @PostMapping("/api/group-meal-status/going")
    public ResponseEntity<?> markUserGoing(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> payload) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
            String groupId = payload.get("groupId");
            String mealType = payload.get("mealType");

            if (groupId == null || mealType == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "groupId and mealType are required"));
            }

            GroupMealStatus status = communityService.markUserGoing(groupId, mealType.toUpperCase(), userId, user.getEmail());
            return ResponseEntity.ok(new GroupMealStatusResponse(status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/api/group-meal-status/{groupId}/{mealType}")
    public ResponseEntity<?> cancelUserGoing(
            @PathVariable String groupId,
            @PathVariable String mealType,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

            GroupMealStatus status = communityService.cancelUserGoing(groupId, mealType.toUpperCase(), user.getEmail());
            return ResponseEntity.ok(new GroupMealStatusResponse(status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/group-meal-status/{groupId}/{mealType}")
    public ResponseEntity<?> getGroupMealStatus(
            @PathVariable String groupId,
            @PathVariable String mealType) {
        try {
            GroupMealStatus status = communityService.getGroupMealStatus(groupId, mealType.toUpperCase());
            return ResponseEntity.ok(new GroupMealStatusResponse(status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // 5. GROUP CHAT
    // ==========================================

    @GetMapping("/api/chat/messages")
    public ResponseEntity<?> getChatMessages(
            @RequestParam String chatType,
            @RequestParam String chatId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            List<ChatResponse> messages = communityService.getMessages(chatType, chatId, page, size);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/api/chat/send")
    public ResponseEntity<?> sendChatMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ChatRequest request) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

            ChatResponse response = communityService.sendMessage(
                    userId,
                    user.getEmail(),
                    request.getChatType(),
                    request.getChatId(),
                    request.getMessage()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/api/chat/{messageId}")
    public ResponseEntity<?> deleteChatMessage(
            @PathVariable String messageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }
            communityService.deleteMessage(messageId, userId);
            return ResponseEntity.ok(Map.of("message", "Message deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
