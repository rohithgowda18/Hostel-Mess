package com.hostel.mess.foodphoto;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface FoodPhotoRepository extends MongoRepository<FoodPhoto, String> {
    List<FoodPhoto> findByMealTypeAndExpiresAtAfter(MealType mealType, Instant now);
    void deleteByExpiresAtBefore(Instant now);
}
