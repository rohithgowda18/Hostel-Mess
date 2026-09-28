package com.hostel.mess.controller;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.hostel.mess.model.MealService;
import com.hostel.mess.service.MealServiceLifecycleService;

@RestController
@RequestMapping("/api/meal-services")
public class MealServiceController {

    @Autowired
    private MealServiceLifecycleService lifecycleService;

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentService() {
        MealService service = lifecycleService.getCurrentOrNextService();
        return ResponseEntity.ok(service);
    }

    @GetMapping("/today")
    public ResponseEntity<?> getTodayServices() {
        String today = LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();
        List<MealService> services = lifecycleService.getOrInitServicesForDate(today);
        return ResponseEntity.ok(services);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "status is required"));
        }
        MealService updated = lifecycleService.updateStatus(id, status);
        return ResponseEntity.ok(updated);
    }
}
