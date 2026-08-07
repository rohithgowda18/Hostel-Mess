package com.hostel.mess.repository;

import com.hostel.mess.model.MealAttendance;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface MealAttendanceRepository extends MongoRepository<MealAttendance, String> {
    Optional<MealAttendance> findByUserEmailAndMealTypeAndDate(String userEmail, String mealType, String date);
    List<MealAttendance> findByMealTypeAndDate(String mealType, String date);
    List<MealAttendance> findByDate(String date);
    List<MealAttendance> findByUserEmail(String userEmail);
}
