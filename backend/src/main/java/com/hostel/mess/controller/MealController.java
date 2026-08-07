package com.hostel.mess.controller;

import java.security.Principal;
import java.time.Instant;
import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.hostel.mess.dto.MealRequest;
import com.hostel.mess.dto.MealResponse;
import com.hostel.mess.model.WeeklyMenu;
import com.hostel.mess.model.MealAttendance;
import com.hostel.mess.model.FoodRating;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.WeeklyMenuRepository;
import com.hostel.mess.repository.MealAttendanceRepository;
import com.hostel.mess.repository.FoodRatingRepository;
import com.hostel.mess.repository.UserRepository;
import com.hostel.mess.service.MealService;

import jakarta.validation.Valid;

@RestController
public class MealController {

    @Autowired
    private MealService mealService;

    @Autowired
    private WeeklyMenuRepository weeklyMenuRepository;

    @Autowired
    private MealAttendanceRepository attendanceRepository;

    @Autowired
    private FoodRatingRepository ratingRepository;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findById(userDetails.getUsername()).orElse(null);
    }

    /**
     * GET /api/meals/today/{mealType}
     */
    @GetMapping("/api/meals/today/{mealType}")
    public ResponseEntity<MealResponse> getTodayMeal(@PathVariable String mealType) {
        MealResponse response = mealService.getTodayMeal(mealType);
        if (response == null) {
            return ResponseEntity.ok(null);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/meals/update
     */
    @PostMapping("/api/meals/update")
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
     * POST /api/meals/submit-consensus
     * Student consensus vote & selection for live meal reporting
     */
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

    /**
     * GET /api/meals/consensus/{mealType}/{date}
     */
    @GetMapping("/api/meals/consensus/{mealType}/{date}")
    public ResponseEntity<?> getMealConsensus(
            @PathVariable String mealType,
            @PathVariable String date) {
        Map<String, Object> consensus = mealService.getMealConsensus(mealType, date);
        return ResponseEntity.ok(consensus);
    }

    /**
     * DELETE /api/meals/admin/{mealType}/today
     */
    @DeleteMapping("/api/meals/admin/{mealType}/today")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTodayMenuAdmin(@PathVariable String mealType) {
        boolean deleted = mealService.deleteTodayMeal(mealType);
        if (deleted) {
            return ResponseEntity.ok(
                Map.of("success", true, "message", "Today's " + mealType + " menu deleted successfully"));
        } else {
            return ResponseEntity.status(404).body(
                Map.of("success", false, "message", "No menu found for " + mealType + " today"));
        }
    }

    // Weekly Menu endpoints merged here
    @GetMapping("/api/weekly-menu")
    public ResponseEntity<?> getWeeklyMenu(@RequestParam("weekStartDate") String weekStartDate) {
        Optional<WeeklyMenu> menuOpt = weeklyMenuRepository.findByWeekStartDate(weekStartDate);
        if (menuOpt.isPresent()) {
            return ResponseEntity.ok(menuOpt.get());
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/api/weekly-menu")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> saveWeeklyMenu(@RequestBody WeeklyMenu weeklyMenu) {
        if (weeklyMenu.getWeekStartDate() == null) {
            return ResponseEntity.badRequest().body("weekStartDate is required");
        }
        Optional<WeeklyMenu> existing = weeklyMenuRepository.findByWeekStartDate(weeklyMenu.getWeekStartDate());
        if (existing.isPresent()) {
            weeklyMenu.setId(existing.get().getId());
        }
        WeeklyMenu saved = weeklyMenuRepository.save(weeklyMenu);
        return ResponseEntity.ok(saved);
    }

    // Attendance endpoints merged here
    @PostMapping("/api/attendance/expected")
    public ResponseEntity<?> setExpectedAttendance(@RequestBody Map<String, Object> body, Principal principal) {
        String userEmail = principal.getName();
        String mealType = (String) body.get("mealType");
        String date = (String) body.get("date");
        Boolean expected = (Boolean) body.get("expected");

        if (mealType == null || date == null || expected == null) {
            return ResponseEntity.badRequest().body("mealType, date, and expected are required fields");
        }

        Optional<MealAttendance> attendanceOpt = attendanceRepository.findByUserEmailAndMealTypeAndDate(userEmail, mealType.toUpperCase(), date);
        MealAttendance attendance;
        if (attendanceOpt.isPresent()) {
            attendance = attendanceOpt.get();
            attendance.setExpected(expected);
        } else {
            attendance = new MealAttendance(userEmail, mealType.toUpperCase(), date, expected);
        }

        MealAttendance saved = attendanceRepository.save(attendance);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/api/attendance/my-status")
    public ResponseEntity<?> getMyStatus(@RequestParam("mealType") String mealType, @RequestParam("date") String date, Principal principal) {
        String userEmail = principal.getName();
        Optional<MealAttendance> attendanceOpt = attendanceRepository.findByUserEmailAndMealTypeAndDate(userEmail, mealType.toUpperCase(), date);
        if (attendanceOpt.isPresent()) {
            return ResponseEntity.ok(attendanceOpt.get());
        }
        Map<String, Object> emptyResponse = new HashMap<>();
        emptyResponse.put("expected", null);
        emptyResponse.put("present", false);
        return ResponseEntity.ok(emptyResponse);
    }

    @PostMapping("/api/attendance/check-in")
    public ResponseEntity<?> checkIn(@RequestBody Map<String, String> body, Principal principal) {
        String userEmail = principal.getName();
        String mealType = body.get("mealType");
        String date = body.get("date");
        String code = body.get("code");

        if (mealType == null || date == null || code == null) {
            return ResponseEntity.badRequest().body("mealType, date, and code are required");
        }

        String expectedCode = "CHECKIN-" + date + "-" + mealType.toUpperCase();
        if (!expectedCode.equalsIgnoreCase(code)) {
            return ResponseEntity.badRequest().body("Invalid QR check-in code.");
        }

        Optional<MealAttendance> attendanceOpt = attendanceRepository.findByUserEmailAndMealTypeAndDate(userEmail, mealType.toUpperCase(), date);
        MealAttendance attendance;
        if (attendanceOpt.isPresent()) {
            attendance = attendanceOpt.get();
        } else {
            attendance = new MealAttendance(userEmail, mealType.toUpperCase(), date, true);
        }

        attendance.setPresent(true);
        attendance.setCheckedInAt(Instant.now());
        
        MealAttendance saved = attendanceRepository.save(attendance);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/api/attendance/stats")
    public ResponseEntity<?> getStats(@RequestParam("date") String date) {
        List<MealAttendance> list = attendanceRepository.findByDate(date);
        
        Map<String, Map<String, Integer>> stats = new HashMap<>();
        String[] mealTypes = {"BREAKFAST", "LUNCH", "SNACKS", "DINNER"};
        
        for (String m : mealTypes) {
            Map<String, Integer> mealStat = new HashMap<>();
            mealStat.put("expectedYes", 0);
            mealStat.put("expectedNo", 0);
            mealStat.put("present", 0);
            mealStat.put("absent", 0);
            stats.put(m, mealStat);
        }

        for (MealAttendance att : list) {
            Map<String, Integer> mealStat = stats.get(att.getMealType());
            if (mealStat != null) {
                if (Boolean.TRUE.equals(att.getExpected())) {
                    mealStat.put("expectedYes", mealStat.get("expectedYes") + 1);
                    if (Boolean.FALSE.equals(att.getPresent())) {
                        mealStat.put("absent", mealStat.get("absent") + 1);
                    }
                } else if (Boolean.FALSE.equals(att.getExpected())) {
                    mealStat.put("expectedNo", mealStat.get("expectedNo") + 1);
                }
                if (Boolean.TRUE.equals(att.getPresent())) {
                    mealStat.put("present", mealStat.get("present") + 1);
                }
            }
        }

        return ResponseEntity.ok(stats);
    }

    // Ratings endpoints merged here
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
        
        try {
            FoodRating saved = mealService.saveOrUpdateRating(rating);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/ratings/{mealType}/{date}")
    public ResponseEntity<?> getRatingsSummary(
            @PathVariable String mealType,
            @PathVariable String date) {
        Map<String, Object> summary = mealService.getMealRatingsSummary(mealType, date);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/api/ratings/my-rating/{mealType}/{date}")
    public ResponseEntity<?> getMyRating(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String mealType,
            @PathVariable String date) {
        User user = getAuthenticatedUser(userDetails);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        
        Optional<FoodRating> rating = ratingRepository.findByUserEmailAndMealTypeAndDate(user.getEmail(), mealType, date);
        if (rating.isPresent()) {
            return ResponseEntity.ok(rating.get());
        }
        return ResponseEntity.ok(Map.of());
    }
}
