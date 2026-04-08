package com.hostel.mess.foodphoto;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FoodPhotoService {
    @Autowired
    private FoodPhotoRepository foodPhotoRepository;

    // Meal window end times
    private static final Map<MealType, LocalTime> MEAL_END_TIMES = new EnumMap<>(MealType.class);
    static {
        MEAL_END_TIMES.put(MealType.BREAKFAST, LocalTime.of(10, 0));
        MEAL_END_TIMES.put(MealType.LUNCH, LocalTime.of(15, 0));
        MEAL_END_TIMES.put(MealType.SNACKS, LocalTime.of(18, 0));
        MEAL_END_TIMES.put(MealType.DINNER, LocalTime.of(22, 0));
    }

    public boolean isMealWindowOpen(MealType mealType) {
        LocalTime now = LocalTime.now(ZoneId.systemDefault());
        switch (mealType) {
            case BREAKFAST: return now.isAfter(LocalTime.of(7, 0)) && now.isBefore(LocalTime.of(10, 1));
            case LUNCH: return now.isAfter(LocalTime.of(12, 0)) && now.isBefore(LocalTime.of(15, 1));
            case SNACKS: return now.isAfter(LocalTime.of(16, 0)) && now.isBefore(LocalTime.of(18, 1));
            case DINNER: return now.isAfter(LocalTime.of(19, 0)) && now.isBefore(LocalTime.of(22, 1));
            default: return false;
        }
    }

    public FoodPhoto savePhoto(MultipartFile image, MealType mealType, String createdBy) {
        if (!isMealWindowOpen(mealType)) {
            throw new IllegalStateException("Upload not allowed outside meal window");
        }
        // In production, upload to S3 or cloud storage. Here, simulate with UUID filename.
        String imageUrl = "/uploads/foodphotos/" + UUID.randomUUID() + "-" + image.getOriginalFilename();
        Instant now = Instant.now();
        Instant expiresAt = getMealWindowEnd(mealType);
        FoodPhoto photo = new FoodPhoto(imageUrl, mealType, createdBy, now, expiresAt);
        return foodPhotoRepository.save(photo);
    }

    public List<FoodPhoto> getCurrentPhotos() {
        Instant now = Instant.now();
        // Only show photos for current meal windows
        return foodPhotoRepository.findAll().stream()
            .filter(photo -> photo.getExpiresAt().isAfter(now))
            .toList();
    }

    public List<FoodPhoto> getCurrentPhotosByMeal(MealType mealType) {
        Instant now = Instant.now();
        return foodPhotoRepository.findByMealTypeAndExpiresAtAfter(mealType, now);
    }

    public void deleteExpiredPhotos() {
        Instant now = Instant.now();
        foodPhotoRepository.deleteByExpiresAtBefore(now);
    }

    private Instant getMealWindowEnd(MealType mealType) {
        LocalTime end = MEAL_END_TIMES.get(mealType);
        return end.atDate(java.time.LocalDate.now()).atZone(ZoneId.systemDefault()).toInstant();
    }
}
