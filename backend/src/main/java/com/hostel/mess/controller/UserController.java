package com.hostel.mess.controller;

import com.hostel.mess.dto.UserInfo;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserRepository userRepository;

    // Get logged-in user's private profile
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
        User user = userOpt.get();
        UserInfo info = new UserInfo(
            user.getId(), user.getEmail(), user.getHostel(), user.getRoomNumber(), user.getYear(), user.getBranch(), user.getRole(),
            user.getFloor(), user.getDirectoryVisible(), user.getPhoneNumber(), user.getProfilePhoto(), user.getFavoriteFoods()
        );
        return ResponseEntity.ok(info);
    }

    // Update logged-in user's profile
    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(@AuthenticationPrincipal UserDetails userDetails, @RequestBody UserInfo update) {
        String userId = userDetails.getUsername();
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
        User user = userOpt.get();
        user.setHostel(update.getHostel());
        user.setFloor(update.getFloor());
        user.setRoomNumber(update.getRoomNumber());
        user.setYear(update.getYear());
        user.setBranch(update.getBranch());
        user.setDirectoryVisible(update.getDirectoryVisible());
        user.setPhoneNumber(update.getPhoneNumber());
        user.setProfilePhoto(update.getProfilePhoto());
        if (update.getFavoriteFoods() != null) {
            user.setFavoriteFoods(update.getFavoriteFoods());
        }
        userRepository.save(user);
        UserInfo info = new UserInfo(
            user.getId(), user.getEmail(), user.getHostel(), user.getRoomNumber(), user.getYear(), user.getBranch(), user.getRole(),
            user.getFloor(), user.getDirectoryVisible(), user.getPhoneNumber(), user.getProfilePhoto(), user.getFavoriteFoods()
        );
        return ResponseEntity.ok(info);
    }

    // Get public profile by userId
    @GetMapping("/{userId}")
    public ResponseEntity<?> getPublicProfile(@PathVariable String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
        User user = userOpt.get();
        // Hide private details if directoryVisible is false
        if (Boolean.FALSE.equals(user.getDirectoryVisible())) {
            UserInfo info = new UserInfo(
                user.getId(), "private@hostel.com", user.getHostel(), null, user.getYear(), user.getBranch(), user.getRole(),
                user.getFloor(), false, null, null, new ArrayList<>()
            );
            return ResponseEntity.ok(info);
        }
        UserInfo info = new UserInfo(
            user.getId(), user.getEmail(), user.getHostel(), user.getRoomNumber(), user.getYear(), user.getBranch(), user.getRole(),
            user.getFloor(), user.getDirectoryVisible(), user.getPhoneNumber(), user.getProfilePhoto(), user.getFavoriteFoods()
        );
        return ResponseEntity.ok(info);
    }

    // Favorites endpoints merged into UserController
    @GetMapping("/favorites")
    public ResponseEntity<?> getFavorites(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user.getFavoriteFoods());
    }

    @PostMapping("/favorites")
    public ResponseEntity<?> saveFavorites(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody List<String> items) {
        String userId = userDetails.getUsername();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setFavoriteFoods(items != null ? items : new ArrayList<>());
        userRepository.save(user);
        return ResponseEntity.ok(user.getFavoriteFoods());
    }

    @Autowired
    private com.hostel.mess.repository.MealSubmissionRepository submissionRepository;

    @Autowired
    private com.hostel.mess.repository.MealAttendanceRepository attendanceRepository;

    @GetMapping("/profile-stats")
    public ResponseEntity<?> getProfileStats(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
        User user = userOpt.get();

        List<com.hostel.mess.model.MealSubmission> submissions = submissionRepository.findByStudentEmail(user.getEmail());
        long photoCount = submissions.stream().filter(s -> s.getPhotoUrl() != null && !s.getPhotoUrl().isEmpty()).count();

        List<com.hostel.mess.model.MealAttendance> attendances = attendanceRepository.findByUserEmail(user.getEmail());
        long checkedInCount = attendances.stream().filter(a -> Boolean.TRUE.equals(a.getPresent())).count();
        int attendanceRate = attendances.size() > 0 ? (int) Math.round(((double) checkedInCount / attendances.size()) * 100) : 95;

        // Calculate leaderboard position
        List<User> allUsers = userRepository.findAll();
        allUsers.sort((a, b) -> Integer.compare(b.getPoints(), a.getPoints()));
        int rank = 1;
        for (int i = 0; i < allUsers.size(); i++) {
            if (allUsers.get(i).getEmail().equalsIgnoreCase(user.getEmail())) {
                rank = i + 1;
                break;
            }
        }

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("points", user.getPoints());
        stats.put("reportsSubmitted", submissions.size());
        stats.put("photosUploaded", photoCount);
        stats.put("mealsCheckedIn", checkedInCount);
        stats.put("attendanceRate", attendanceRate);
        stats.put("badges", user.getBadges());
        stats.put("rank", rank);
        stats.put("totalUsers", allUsers.size());

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard() {
        List<User> users = userRepository.findAll();
        users.sort((a, b) -> Integer.compare(b.getPoints(), a.getPoints()));
        List<java.util.Map<String, Object>> leaderboard = new ArrayList<>();
        int rank = 1;
        for (User u : users) {
            if (leaderboard.size() >= 10) break;
            java.util.Map<String, Object> entry = new java.util.HashMap<>();
            entry.put("rank", rank++);
            entry.put("email", u.getEmail());
            entry.put("hostel", u.getHostel());
            entry.put("points", u.getPoints());
            entry.put("badges", u.getBadges());
            entry.put("profilePhoto", u.getProfilePhoto());
            leaderboard.add(entry);
        }
        return ResponseEntity.ok(leaderboard);
    }
}
