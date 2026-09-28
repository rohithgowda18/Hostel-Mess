package com.hostel.mess.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.hostel.mess.dto.UserInfo;
import com.hostel.mess.model.MealSubmission;
import com.hostel.mess.service.UserService;

/**
 * Controller 5: UserController
 * Domain: User-facing account/profile/contribution information,
 * leaderboard, favorites, and search.
 */
@RestController
public class UserController {

    @Autowired
    private UserService userService;

    // Get logged-in user's private profile
    @GetMapping("/api/users/me")
    public ResponseEntity<?> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        return userService.getMyProfile(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Update logged-in user's profile
    @PutMapping("/api/users/me")
    public ResponseEntity<?> updateMyProfile(@AuthenticationPrincipal UserDetails userDetails, @RequestBody UserInfo update) {
        String userId = userDetails.getUsername();
        return userService.updateMyProfile(userId, update)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Get public profile by userId
    @GetMapping("/api/users/{userId}")
    public ResponseEntity<?> getPublicProfile(@PathVariable String userId) {
        return userService.getPublicProfile(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Favorites endpoints
    @GetMapping("/api/users/favorites")
    public ResponseEntity<List<String>> getFavorites(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        return ResponseEntity.ok(userService.getFavorites(userId));
    }

    @PostMapping("/api/users/favorites")
    public ResponseEntity<List<String>> saveFavorites(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody List<String> items) {
        String userId = userDetails.getUsername();
        return ResponseEntity.ok(userService.saveFavorites(userId, items));
    }

    // Get logged-in user's meal report history (submissions)
    @GetMapping("/api/users/my-reports")
    public ResponseEntity<List<MealSubmission>> getMyReports(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        return ResponseEntity.ok(userService.getMyReports(userId));
    }

    // Get profile contribution & leaderboard statistics
    @GetMapping("/api/users/profile-stats")
    public ResponseEntity<Map<String, Object>> getProfileStats(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        return ResponseEntity.ok(userService.getProfileStats(userId));
    }

    // Get top 10 leaderboard
    @GetMapping("/api/users/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard() {
        return ResponseEntity.ok(userService.getLeaderboard());
    }

    // Universal Search: /api/search?q=...
    @GetMapping("/api/search")
    public ResponseEntity<Map<String, Object>> search(@RequestParam(value = "q", required = false) String q) {
        return ResponseEntity.ok(userService.universalSearch(q));
    }
}
