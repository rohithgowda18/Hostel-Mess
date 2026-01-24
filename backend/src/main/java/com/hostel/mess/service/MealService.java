package com.hostel.mess.service;

import com.hostel.mess.dto.MealRequest;
import com.hostel.mess.dto.MealResponse;
import com.hostel.mess.model.MealUpdate;
import com.hostel.mess.repository.MealRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class MealService {

    @Autowired
    private MealRepository mealRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Get today's meal for a specific meal type
     */
    public MealResponse getTodayMeal(String mealType) {
        String today = LocalDate.now().format(DATE_FORMATTER);
        Optional<MealUpdate> mealOpt = mealRepository.findByMealTypeAndDate(mealType.toUpperCase(), today);

        if (mealOpt.isEmpty()) {
            return null;
        }

        MealUpdate meal = mealOpt.get();
        return new MealResponse(
                meal.getMealType(),
                meal.getDate(),
                meal.getItems(),
                meal.getPostedAt().toString()
        );
    }

    /**
     * Update or create today's meal for a specific meal type
     */
    public MealResponse updateMeal(MealRequest request) {
        String mealType = request.getMealType().toUpperCase();
        
        // Check if an entry for this mealType + date already exists
        Optional<MealUpdate> existingOpt = mealRepository.findByMealTypeAndDate(mealType, request.getDate());

        MealUpdate meal;
        if (existingOpt.isPresent()) {
            // Update existing entry (overwrite)
            meal = existingOpt.get();
            meal.setItems(request.getItems());
            meal.setPostedAt(Instant.now());
        } else {
            // Create new entry
            meal = new MealUpdate();
            meal.setMealType(mealType);
            meal.setDate(request.getDate());
            meal.setItems(request.getItems());
            meal.setPostedAt(Instant.now());
        }

        MealUpdate saved = mealRepository.save(meal);

        return new MealResponse(
                saved.getMealType(),
                saved.getDate(),
                saved.getItems(),
                saved.getPostedAt().toString()
        );
    }
}
