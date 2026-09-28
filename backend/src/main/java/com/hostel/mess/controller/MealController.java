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

    @Autowired(required = false)
    private com.hostel.mess.service.MealServiceLifecycleService mealServiceLifecycleService;

    @org.springframework.beans.factory.annotation.Value("${jwt.secret:${app.jwtSecret:${JWT_SECRET:change-me-in-production-min-32-chars-please}}}")
    private String jwtSecret;

    private static final java.util.concurrent.ConcurrentHashMap<String, Long> ACTIVE_NONCES = new java.util.concurrent.ConcurrentHashMap<>();

    private String buildCheckinCode(String mealType, String date) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] h = mac.doFinal((date + "|" + mealType.toUpperCase()).getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : h) hex.append(String.format("%02x", b));
            String signature = hex.substring(0, 6).toUpperCase();
            
            // Generate single-use nonce expiring in 70 seconds
            String nonce = java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            ACTIVE_NONCES.put(nonce, System.currentTimeMillis() + 70000);

            return "PASS-" + signature + "-" + nonce;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate check-in code", e);
        }
    }

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) {
            return null;
        }
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
     * POST /api/meals/submit-consensus Student consensus vote & selection for
     * live meal reporting
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

    // Weekly Menu endpoints merged here
    @GetMapping("/api/weekly-menu")
    public ResponseEntity<?> getWeeklyMenu(@RequestParam(value = "weekStartDate", required = false) String weekStartDate) {
        if (weekStartDate != null) {
            Optional<WeeklyMenu> menuOpt = weeklyMenuRepository.findByWeekStartDate(weekStartDate);
            if (menuOpt.isPresent()) {
                return ResponseEntity.ok(menuOpt.get());
            }
        }
        List<WeeklyMenu> allMenus = weeklyMenuRepository.findAll();
        if (!allMenus.isEmpty()) {
            return ResponseEntity.ok(allMenus.get(0));
        }
        return ResponseEntity.ok(Map.of());
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

        if (mealServiceLifecycleService != null) {
            mealServiceLifecycleService.incrementExpectedAttendance(date, mealType, expected);
        }

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

    @GetMapping("/api/attendance/qr-code")
    public ResponseEntity<?> getQrCode(@RequestParam("mealType") String mealType, @RequestParam("date") String date) {
        if (mealType == null || date == null) {
            return ResponseEntity.badRequest().body("mealType and date are required");
        }
        String code = buildCheckinCode(mealType, date);
        return ResponseEntity.ok(Map.of(
            "code", code,
            "mealType", mealType.toUpperCase(),
            "date", date,
            "expiresInSeconds", 60
        ));
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

        // Anti-Replay Nonce Verification (User Spec #16)
        String[] parts = code.trim().split("-");
        if (parts.length >= 3) {
            String nonce = parts[parts.length - 1];
            Long expiry = ACTIVE_NONCES.get(nonce);
            if (expiry == null || System.currentTimeMillis() > expiry) {
                return ResponseEntity.badRequest().body("Dining pass has expired or was already consumed. Please refresh.");
            }
            // Consume nonce immediately
            ACTIVE_NONCES.remove(nonce);
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

        if (mealServiceLifecycleService != null) {
            mealServiceLifecycleService.incrementActualAttendance(date, mealType);
        }

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
