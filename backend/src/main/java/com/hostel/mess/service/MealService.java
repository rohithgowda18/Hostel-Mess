package com.hostel.mess.service;

import com.hostel.mess.dto.MealRequest;
import com.hostel.mess.dto.MealResponse;
import com.hostel.mess.model.MealUpdate;
import com.hostel.mess.repository.MealRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class MealService {

    @Autowired
    private MealRepository mealRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // Time windows for each meal type
    private static final Map<String, TimeWindow> MEAL_TIME_WINDOWS = Map.of(
            "BREAKFAST", new TimeWindow(LocalTime.of(7, 0), LocalTime.of(9, 30)),
            "LUNCH", new TimeWindow(LocalTime.of(12, 0), LocalTime.of(14, 30)),
            "SNACKS", new TimeWindow(LocalTime.of(16, 30), LocalTime.of(18, 0)),
            "DINNER", new TimeWindow(LocalTime.of(19, 30), LocalTime.of(21, 30))
    );

    // Threshold for verification
    private static final int VERIFICATION_THRESHOLD = 3;

    // Set to true to disable time restrictions (for testing)
    private static final boolean DISABLE_TIME_RESTRICTIONS = true;

    // Default sample meals for when nothing is in database
    private static final Map<String, java.util.List<String>> DEFAULT_MEALS = Map.of(
            "BREAKFAST", Arrays.asList("Idli", "Dosa", "Poori", "Upma"),
            "LUNCH", Arrays.asList("Rice", "Sambar", "Rasam", "Chapati", "Vegetable Curry"),
            "SNACKS", Arrays.asList("Tea", "Coffee", "Samosa", "Biscuits"),
            "DINNER", Arrays.asList("Chapati", "Rice", "Dal", "Curry")
    );

    /**
     * Check if the current time is within the allowed window for a meal type
     */
    public boolean isWithinTimeWindow(String mealType) {
        // Bypass time check if disabled for testing
        if (DISABLE_TIME_RESTRICTIONS) return true;

        TimeWindow window = MEAL_TIME_WINDOWS.get(mealType.toUpperCase());
        if (window == null) return false;

        LocalTime now = LocalTime.now();
        return !now.isBefore(window.start) && !now.isAfter(window.end);
    }

    /**
     * Get the time window message for a meal type
     */
    public String getTimeWindowMessage(String mealType) {
        TimeWindow window = MEAL_TIME_WINDOWS.get(mealType.toUpperCase());
        if (window == null) return "Invalid meal type";

        if (isWithinTimeWindow(mealType)) {
            return String.format("Update window open until %s", window.end.toString());
        } else {
            return String.format("Update window: %s - %s", window.start.toString(), window.end.toString());
        }
    }

    /**
     * Get today's meal for a specific meal type
     */
    public MealResponse getTodayMeal(String mealType) {
        String today = LocalDate.now().format(DATE_FORMATTER);
        Optional<MealUpdate> mealOpt = mealRepository.findByMealTypeAndDate(mealType.toUpperCase(), today);

        MealResponse response = new MealResponse();
        response.setMealType(mealType.toUpperCase());
        response.setDate(today);
        response.setUpdateWindowOpen(isWithinTimeWindow(mealType));
        response.setUpdateWindowMessage(getTimeWindowMessage(mealType));

        if (mealOpt.isEmpty()) {
            // Return default sample meals if nothing in database
            java.util.List<String> defaultItems = DEFAULT_MEALS.getOrDefault(mealType.toUpperCase(), Arrays.asList());
            System.out.println("DEBUG: Using default meals for " + mealType.toUpperCase() + ": " + defaultItems);
            response.setItems(defaultItems);
            response.setConfirmations(0);
            response.setVerificationStatus("DEFAULT");
            return response;
        }

        MealUpdate meal = mealOpt.get();
        response.setItems(meal.getItems());
        response.setPostedAt(meal.getPostedAt().toString());
        response.setConfirmations(meal.getConfirmations());
        response.setVerificationStatus(meal.getVerificationStatus());

        return response;
    }

    /**
     * Delete today's meal for a specific meal type (Admin only)
     */
    public boolean deleteTodayMeal(String mealType) {
        String today = LocalDate.now().format(DATE_FORMATTER);
        Optional<MealUpdate> mealOpt = mealRepository.findByMealTypeAndDate(
                mealType.toUpperCase(), today);
        
        if (mealOpt.isEmpty()) {
            return false; // Meal not found
        }
        
        mealRepository.deleteById(mealOpt.get().getId());
        return true; // Successfully deleted
    }

    /**
     * Update or create today's meal for a specific meal type
     */
    public MealResponse updateMeal(MealRequest request) {
        String mealType = request.getMealType().toUpperCase();

        // Check if within time window
        if (!isWithinTimeWindow(mealType)) {
            MealResponse response = new MealResponse();
            response.setMealType(mealType);
            response.setDate(request.getDate());
            response.setUpdateWindowOpen(false);
            response.setUpdateWindowMessage(getTimeWindowMessage(mealType) + " - Update closed!");
            return response;
        }

        // Check if an entry for this mealType + date already exists
        Optional<MealUpdate> existingOpt = mealRepository.findByMealTypeAndDate(mealType, request.getDate());

        MealUpdate meal;
        if (existingOpt.isPresent()) {
            meal = existingOpt.get();

            // Check if the items are the same (confirmation) or different (new update)
            Set<String> existingItems = new HashSet<>(meal.getItems());
            Set<String> newItems = new HashSet<>(request.getItems());

            if (existingItems.equals(newItems)) {
                // Same items - this is a confirmation
                meal.setConfirmations(meal.getConfirmations() + 1);

                // Update verification status based on confirmations
                if (meal.getConfirmations() >= VERIFICATION_THRESHOLD) {
                    meal.setVerificationStatus("VERIFIED");
                }
            } else {
                // Different items - new update, reset confirmations but mark as uncertain if there were confirmations
                if (meal.getConfirmations() > 1) {
                    meal.setVerificationStatus("UNCERTAIN");
                } else {
                    meal.setVerificationStatus("UNVERIFIED");
                }
                meal.setItems(request.getItems());
                meal.setConfirmations(1);
            }
            meal.setPostedAt(Instant.now());
        } else {
            // Create new entry
            meal = new MealUpdate();
            meal.setMealType(mealType);
            meal.setDate(request.getDate());
            meal.setItems(request.getItems());
            meal.setPostedAt(Instant.now());
            meal.setConfirmations(1);
            meal.setVerificationStatus("UNVERIFIED");
        }

        MealUpdate saved = mealRepository.save(meal);

        MealResponse response = new MealResponse();
        response.setMealType(saved.getMealType());
        response.setDate(saved.getDate());
        response.setItems(saved.getItems());
        response.setPostedAt(saved.getPostedAt().toString());
        response.setConfirmations(saved.getConfirmations());
        response.setVerificationStatus(saved.getVerificationStatus());
        response.setUpdateWindowOpen(true);
        response.setUpdateWindowMessage(getTimeWindowMessage(mealType));

        return response;
    }

    // Helper class for time windows
    private static class TimeWindow {
        LocalTime start;
        LocalTime end;

        TimeWindow(LocalTime start, LocalTime end) {
            this.start = start;
            this.end = end;
        }
    }
}
