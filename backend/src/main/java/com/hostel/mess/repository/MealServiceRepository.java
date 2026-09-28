package com.hostel.mess.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import com.hostel.mess.model.MealService;

@Repository
public interface MealServiceRepository extends MongoRepository<MealService, String> {
    Optional<MealService> findByDateAndMealType(String date, String mealType);
    List<MealService> findByDate(String date);
    List<MealService> findByStatus(String status);
}
