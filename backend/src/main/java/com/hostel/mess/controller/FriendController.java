package com.hostel.mess.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.hostel.mess.model.Friendship;
import com.hostel.mess.service.FriendService;

@RestController
@RequestMapping("/api/friends")
@CrossOrigin(origins = "*")
public class FriendController {

    @Autowired
    private FriendService friendService;

    @GetMapping
    public ResponseEntity<?> getFriends(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = getUserId(userDetails);
            return ResponseEntity.ok(friendService.getFriendsData(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/request")
    public ResponseEntity<?> sendRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> payload) {
        try {
            String userId = getUserId(userDetails);
            String target = payload.get("target");
            if (target == null || target.trim().isEmpty()) {
                target = payload.get("targetEmail");
            }
            if (target == null || target.trim().isEmpty()) {
                target = payload.get("email");
            }
            Friendship friendship = friendService.sendFriendRequest(userId, target);
            return ResponseEntity.status(HttpStatus.CREATED).body(friendship);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/accept/{requestId}")
    public ResponseEntity<?> acceptRequest(
            @PathVariable String requestId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = getUserId(userDetails);
            Friendship friendship = friendService.acceptFriendRequest(userId, requestId);
            return ResponseEntity.ok(friendship);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reject/{requestId}")
    public ResponseEntity<?> rejectRequest(
            @PathVariable String requestId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = getUserId(userDetails);
            friendService.rejectFriendRequest(userId, requestId);
            return ResponseEntity.ok(Map.of("message", "Friend request rejected"));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<?> removeFriend(
            @PathVariable String friendId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = getUserId(userDetails);
            friendService.removeFriend(userId, friendId);
            return ResponseEntity.ok(Map.of("message", "Friend removed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/notify-settings")
    public ResponseEntity<?> updateNotifySettings(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> payload) {
        try {
            String userId = getUserId(userDetails);
            @SuppressWarnings("unchecked")
            List<String> notifyFriendIds = (List<String>) payload.get("notifyFriendIds");
            List<String> updated = friendService.updateNotifyFriends(userId, notifyFriendIds);
            return ResponseEntity.ok(Map.of("notifyFriendIds", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/meal-call")
    public ResponseEntity<?> sendMealCall(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = getUserId(userDetails);
            Map<String, Object> result = friendService.sendMealCall(userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private String getUserId(UserDetails userDetails) {
        if (userDetails == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        }
        return userDetails.getUsername();
    }
}
