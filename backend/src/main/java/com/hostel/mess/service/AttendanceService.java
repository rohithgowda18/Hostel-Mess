package com.hostel.mess.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.hostel.mess.exception.BadRequestException;
import com.hostel.mess.model.MealAttendance;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.MealAttendanceRepository;
import com.hostel.mess.repository.UserRepository;

@Service
public class AttendanceService {

    @Autowired
    private MealAttendanceRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MealService mealService;

    @Autowired(required = false)
    private WebSocketEventService wsService;

    @Value("${jwt.secret:${app.jwtSecret:${JWT_SECRET:change-me-in-production-min-32-chars-please}}}")
    private String jwtSecret;

    private static final ConcurrentHashMap<String, Long> ACTIVE_NONCES = new ConcurrentHashMap<>();

    public String buildCheckinCode(String mealType, String date) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] h = mac.doFinal((date + "|" + mealType.toUpperCase()).getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : h) hex.append(String.format("%02x", b));
            String signature = hex.substring(0, 6).toUpperCase();

            // Generate single-use nonce expiring in 70 seconds
            String nonce = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            ACTIVE_NONCES.put(nonce, System.currentTimeMillis() + 70000);

            return "PASS-" + signature + "-" + nonce;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate check-in code", e);
        }
    }

    public MealAttendance setExpectedAttendance(String userEmail, String mealType, String date, Boolean expected) {
        // Enforce: attendance declaration only allowed during an active meal window
        mealService.validateActiveMeal(mealType, "attendance declaration");

        String mType = mealType.toUpperCase();
        Optional<MealAttendance> attendanceOpt = attendanceRepository.findByUserEmailAndMealTypeAndDate(userEmail, mType, date);
        MealAttendance attendance;
        if (attendanceOpt.isPresent()) {
            attendance = attendanceOpt.get();
            attendance.setExpected(expected);
        } else {
            attendance = new MealAttendance(userEmail, mType, date, expected);
        }
        MealAttendance saved = attendanceRepository.save(attendance);

        if (wsService != null) {
            wsService.broadcastAppEvent("ATTENDANCE_INTENT_UPDATED", Map.of(
                    "userEmail", userEmail,
                    "mealType", mType,
                    "date", date,
                    "expected", expected
            ));
        }

        return saved;
    }

    public MealAttendance getMyAttendanceStatus(String userEmail, String mealType, String date) {
        return attendanceRepository.findByUserEmailAndMealTypeAndDate(userEmail, mealType.toUpperCase(), date)
                .orElse(null);
    }

    public Map<String, Object> generateQrCode(String userEmail, String mealType, String date) {
        String mType = mealType.toUpperCase();
        String code = buildCheckinCode(mType, date);
        MealAttendance att = attendanceRepository.findByUserEmailAndMealTypeAndDate(userEmail, mType, date).orElse(null);
        boolean present = att != null && Boolean.TRUE.equals(att.getPresent());

        Map<String, Object> res = new HashMap<>();
        res.put("code", code);
        res.put("expiresInSeconds", 60);
        res.put("userEmail", userEmail);
        res.put("mealType", mType);
        res.put("date", date);
        res.put("checkedIn", present);
        return res;
    }

    public Map<String, Object> processCheckIn(String userEmail, String mealType, String date, String code) {
        String mType = mealType.toUpperCase();
        String[] parts = code.split("-");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid dining pass format");
        }
        String nonce = parts[2];
        Long exp = ACTIVE_NONCES.remove(nonce);
        if (exp == null || System.currentTimeMillis() > exp) {
            throw new IllegalArgumentException("Pass code expired or already scanned. Please refresh your pass.");
        }

        Optional<MealAttendance> attendanceOpt = attendanceRepository.findByUserEmailAndMealTypeAndDate(userEmail, mType, date);
        MealAttendance attendance;
        if (attendanceOpt.isPresent()) {
            attendance = attendanceOpt.get();
        } else {
            attendance = new MealAttendance(userEmail, mType, date, true);
        }
        attendance.setPresent(true);
        attendance.setCheckedInAt(Instant.now());
        attendanceRepository.save(attendance);

        // Award punctuality points
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user != null) {
            user.addPoints(5);
            userRepository.save(user);
        }

        if (wsService != null) {
            wsService.broadcastAppEvent("ATTENDANCE_CHECKIN", Map.of(
                    "userEmail", userEmail,
                    "mealType", mType,
                    "date", date,
                    "present", true
            ));
        }

        Map<String, Object> res = new HashMap<>();
        res.put("status", "SUCCESS");
        res.put("message", "Dining pass verified. Welcome to " + mType + " service!");
        res.put("mealType", mType);
        res.put("checkedInAt", attendance.getCheckedInAt().toString());
        return res;
    }

    public Map<String, Object> getAttendanceStats(String date) {
        List<MealAttendance> list = attendanceRepository.findByDate(date);
        int totalExpected = 0;
        int totalPresent = 0;
        Map<String, Integer> mealPresents = new HashMap<>();

        for (MealAttendance a : list) {
            if (Boolean.TRUE.equals(a.getExpected())) totalExpected++;
            if (Boolean.TRUE.equals(a.getPresent())) {
                totalPresent++;
                mealPresents.put(a.getMealType(), mealPresents.getOrDefault(a.getMealType(), 0) + 1);
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("date", date);
        stats.put("totalExpected", totalExpected);
        stats.put("totalPresent", totalPresent);
        stats.put("mealBreakdown", mealPresents);
        return stats;
    }

    public List<Map<String, Object>> getAttendanceRoster(String mealType, String date) {
        String mType = mealType.toUpperCase();
        List<MealAttendance> list = "ALL".equalsIgnoreCase(mType)
                ? attendanceRepository.findByDate(date)
                : attendanceRepository.findByMealTypeAndDate(mType, date);

        List<Map<String, Object>> records = new ArrayList<>();
        for (MealAttendance a : list) {
            Map<String, Object> row = new HashMap<>();
            String email = a.getUserEmail() != null ? a.getUserEmail() : "";
            User u = userRepository.findByEmail(email).orElse(null);

            row.put("id", a.getId());
            row.put("student", (u != null && u.getEmail() != null) ? u.getEmail().split("@")[0] : email.split("@")[0]);
            row.put("email", email);
            row.put("block", (u != null && u.getHostel() != null) ? u.getHostel() : "A");
            row.put("room", (u != null && u.getRoomNumber() != null) ? u.getRoomNumber() : "Assigned");
            row.put("meal", a.getMealType());
            row.put("expected", Boolean.TRUE.equals(a.getExpected()));
            row.put("present", Boolean.TRUE.equals(a.getPresent()));
            row.put("time", a.getCheckedInAt() != null ? a.getCheckedInAt().toString() : "Not scanned");
            row.put("method", Boolean.TRUE.equals(a.getPresent()) ? "QR Code" : "Pending");
            records.add(row);
        }
        return records;
    }
}
