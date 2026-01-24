package com.hostel.mess.repository;

import com.hostel.mess.model.MealUpdate;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MealRepository extends MongoRepository<MealUpdate, String> {

    Optional<MealUpdate> findByMealTypeAndDate(String mealType, String date);
}
