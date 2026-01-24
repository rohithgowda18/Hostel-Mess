package com.hostel.mess.controller;

import com.hostel.mess.dto.MealRequest;
import com.hostel.mess.dto.MealResponse;
import com.hostel.mess.service.MealService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/meals")
@CrossOrigin(origins = "http://localhost:3000")
public class MealController {

    @Autowired
    private MealService mealService;

    /**
     * GET /api/meals/today/{mealType}
     * Fetch today's food for given meal type
     */
    @GetMapping("/today/{mealType}")
    public ResponseEntity<MealResponse> getTodayMeal(@PathVariable String mealType) {
        MealResponse response = mealService.getTodayMeal(mealType);
        if (response == null) {
            return ResponseEntity.ok(null);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/meals/update
     * Save today's food for a meal
     */
    @PostMapping("/update")
    public ResponseEntity<MealResponse> updateMeal(@Valid @RequestBody MealRequest request) {
        MealResponse response = mealService.updateMeal(request);
        return ResponseEntity.ok(response);
    }
}
