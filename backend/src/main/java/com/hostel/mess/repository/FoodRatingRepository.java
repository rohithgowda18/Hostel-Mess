package com.hostel.mess.repository;

import com.hostel.mess.model.FoodRating;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface FoodRatingRepository extends MongoRepository<FoodRating, String> {
    Optional<FoodRating> findByUserEmailAndMealTypeAndDate(String userEmail, String mealType, String date);
    List<FoodRating> findByMealTypeAndDate(String mealType, String date);
    List<FoodRating> findByDate(String date);
    List<FoodRating> findByDateBetween(String startDate, String endDate);
}
