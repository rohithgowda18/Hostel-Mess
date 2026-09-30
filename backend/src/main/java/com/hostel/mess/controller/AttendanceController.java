package com.hostel.mess.controller;

import java.security.Principal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.hostel.mess.exception.BadRequestException;
import com.hostel.mess.model.MealAttendance;
import com.hostel.mess.service.AttendanceService;

/**
 * Controller 3: AttendanceController
 * Domain: Attendance & Check-in (Expected intent, QR dining pass, scanning, roster)
 */
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @PostMapping("/expected")
    public ResponseEntity<?> setExpectedAttendance(@RequestBody Map<String, Object> body, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        String userEmail = principal.getName();
        String mealType = (String) body.get("mealType");
        String date = (String) body.get("date");
        Boolean expected = (Boolean) body.get("expected");

        if (mealType == null || date == null || expected == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "mealType, date, and expected are required fields"));
        }

        try {
            MealAttendance saved = attendanceService.setExpectedAttendance(userEmail, mealType, date, expected);
            return ResponseEntity.ok(saved);
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage(), "message", e.getMessage()));
        }
    }

    @GetMapping("/my-status")
    public ResponseEntity<?> getMyAttendanceStatus(
            @RequestParam String mealType,
            @RequestParam String date,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        MealAttendance attendance = attendanceService.getMyAttendanceStatus(principal.getName(), mealType, date);
        if (attendance == null) {
            return ResponseEntity.ok(Map.of(
                    "expected", false,
                    "present", false,
                    "checkedInAt", ""
            ));
        }
        return ResponseEntity.ok(attendance);
    }

    @GetMapping("/qr-code")
    public ResponseEntity<?> getDiningQrCode(
            @RequestParam String mealType,
            @RequestParam String date,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        Map<String, Object> qrData = attendanceService.generateQrCode(principal.getName(), mealType, date);
        return ResponseEntity.ok(qrData);
    }

    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn(@RequestBody Map<String, String> body, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        String mealType = body.get("mealType");
        String date = body.get("date");
        String code = body.get("code");

        if (mealType == null || date == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "mealType, date, and code are required"));
        }

        try {
            Map<String, Object> result = attendanceService.processCheckIn(principal.getName(), mealType, date, code);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getAttendanceStats(@RequestParam(required = false) String date) {
        String queryDate = date != null ? date : LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();
        Map<String, Object> stats = attendanceService.getAttendanceStats(queryDate);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/roster")
    public ResponseEntity<?> getAttendanceRoster(
            @RequestParam(defaultValue = "LUNCH") String mealType,
            @RequestParam(required = false) String date) {
        String queryDate = date != null ? date : LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();
        List<Map<String, Object>> roster = attendanceService.getAttendanceRoster(mealType, queryDate);
        return ResponseEntity.ok(roster);
    }
}
