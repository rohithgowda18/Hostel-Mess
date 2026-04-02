package com.hostel.mess.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hostel.mess.dto.BreakfastRequest;
import com.hostel.mess.dto.BreakfastResponse;
import com.hostel.mess.service.BreakfastService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/breakfast")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "https://rohithgowda18.github.io", "https://hostel-mess-one.vercel.app"})
public class BreakfastController {

    @Autowired
    private BreakfastService breakfastService;

    /**
     * GET /api/breakfast/today
     * Fetch today's breakfast
     */
    @GetMapping("/today")
    public ResponseEntity<BreakfastResponse> getTodayBreakfast() {
        BreakfastResponse response = breakfastService.getTodayBreakfast();
        if (response == null) {
            return ResponseEntity.ok(null);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/breakfast/update
     * Save today's breakfast
     */
    @PostMapping("/update")
    public ResponseEntity<BreakfastResponse> updateBreakfast(@Valid @RequestBody BreakfastRequest request) {
        BreakfastResponse response = breakfastService.updateBreakfast(request);
        return ResponseEntity.ok(response);
    }
}
