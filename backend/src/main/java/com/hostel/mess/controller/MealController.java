package com.hostel.mess.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.hostel.mess.dto.MealResponse;
import com.hostel.mess.model.MealPhoto;
import com.hostel.mess.model.User;
import com.hostel.mess.model.WeeklyMenu;
import com.hostel.mess.repository.UserRepository;
import com.hostel.mess.service.MealService;

/**
 * Controller 2: MealController
 * Domain: Everything directly related to meals (today's meal, consensus, reporting,
 * verification, weekly menu, meal service windows, photos, favorites)
 */
@RestController
public class MealController {

    @Autowired
    private MealService mealService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findById(userDetails.getUsername()).orElse(null);
    }

    // ==========================================
    // 1. TODAY'S MEAL & COMMUNITY CONSENSUS
    // ==========================================

    @GetMapping("/api/meals/today/{mealType}")
    public ResponseEntity<MealResponse> getTodayMeal(@PathVariable String mealType) {
        MealResponse response = mealService.getTodayMeal(mealType);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/meals/active-slot")
    public ResponseEntity<?> getActiveSlotInfo() {
        return ResponseEntity.ok(mealService.getActiveSlotInfo());
    }

    @PostMapping("/api/meals/submit-consensus")
    public ResponseEntity<?> submitConsensus(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> payload) {
        User user = getAuthenticatedUser(userDetails);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        String mealType = (String) payload.get("mealType");
        String date = (String) payload.get("date");
        List<String> items = (List<String>) payload.get("items");
        String photoUrl = (String) payload.get("photoUrl");

        if (mealType == null || date == null || items == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "mealType, date, and items are required"));
        }

        Map<String, Object> result = mealService.processStudentSubmission(user, mealType, date, items, photoUrl);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/api/meals/verify")
    public ResponseEntity<?> verifyMealItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> payload) {
        User user = getAuthenticatedUser(userDetails);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        String mealType = (String) payload.get("mealType");
        String date = (String) payload.get("date");
        String foodItem = (String) payload.get("foodItem");
        String vote = (String) payload.get("vote");

        if (mealType == null || date == null || foodItem == null || vote == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "mealType, date, foodItem, and vote are required"));
        }

        Map<String, Object> consensus = mealService.processVerification(user.getEmail(), mealType, date, foodItem, vote);
        return ResponseEntity.ok(consensus);
    }

    @GetMapping("/api/meals/consensus/{mealType}/{date}")
    public ResponseEntity<?> getMealConsensus(
            @PathVariable String mealType,
            @PathVariable String date) {
        Map<String, Object> consensus = mealService.getMealConsensus(mealType, date);
        return ResponseEntity.ok(consensus);
    }

    // ==========================================
    // 2. WEEKLY MENU
    // ==========================================

    @GetMapping("/api/weekly-menu")
    public ResponseEntity<?> getWeeklyMenu(@RequestParam(value = "weekStartDate", required = false) String weekStartDate) {
        WeeklyMenu menu = mealService.getWeeklyMenu(weekStartDate);
        return ResponseEntity.ok(menu);
    }

    @PostMapping("/api/weekly-menu")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> saveWeeklyMenu(@RequestBody WeeklyMenu weeklyMenu) {
        try {
            WeeklyMenu saved = mealService.saveWeeklyMenu(weeklyMenu);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // 3. MEAL SERVICE WINDOWS / LIFECYCLE
    // ==========================================

    @GetMapping("/api/meal-services/current")
    public ResponseEntity<?> getCurrentMealService() {
        com.hostel.mess.model.MealService service = mealService.getCurrentOrNextService();
        return ResponseEntity.ok(service);
    }

    @GetMapping("/api/meal-services/today")
    public ResponseEntity<?> getTodayMealServices() {
        String today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata")).toString();
        List<com.hostel.mess.model.MealService> services = mealService.getOrInitServicesForDate(today);
        return ResponseEntity.ok(services);
    }

    @PutMapping("/api/meal-services/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateMealServiceStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "status is required"));
        }
        com.hostel.mess.model.MealService updated = mealService.updateMealServiceStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    // ==========================================
    // 4. MEAL PHOTOS EVIDENCE
    // ==========================================

    @GetMapping("/api/meals/current/photos")
    public ResponseEntity<?> getCurrentMealPhotos() {
        return ResponseEntity.ok(mealService.getCurrentMealPhotos());
    }

    @PostMapping("/api/student-photos/upload")
    public ResponseEntity<?> uploadMealPhoto(
            @RequestParam("images") List<MultipartFile> images,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "caption", required = false) String caption,
            @RequestParam(value = "mealType", required = false) String mealTypeParam,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required to upload photo"));
        }
        try {
            String text = (caption != null && !caption.trim().isEmpty()) ? caption.trim() : description;
            MealPhoto saved = mealService.uploadMealPhoto(images, text, mealTypeParam, principal);
            return ResponseEntity.ok(saved);
        } catch (com.hostel.mess.exception.BadRequestException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage(), "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        }
    }

    @GetMapping("/api/student-photos/today")
    public ResponseEntity<?> getTodayMealPhotos() {
        return ResponseEntity.ok(mealService.getTodayPhotos());
    }

    @GetMapping("/api/student-photos/{id}/image")
    public ResponseEntity<?> streamMealPhotoImage(@PathVariable String id) {
        return mealService.streamMealPhotoImage(id);
    }

    // ==========================================
    // 5. FAVORITE FOODS
    // ==========================================

    @GetMapping("/api/favorites")
    public ResponseEntity<?> getFavorites(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        return ResponseEntity.ok(mealService.getFavorites(userId));
    }

    @PostMapping("/api/favorites")
    public ResponseEntity<?> saveFavorites(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody List<String> items) {
        String userId = userDetails.getUsername();
        return ResponseEntity.ok(mealService.saveFavorites(userId, items));
    }
}
