package com.hostel.mess.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import com.hostel.mess.model.MealSubmission;

@Repository
public interface MealSubmissionRepository extends MongoRepository<MealSubmission, String> {
    List<MealSubmission> findByMealTypeAndDate(String mealType, String date);
    Optional<MealSubmission> findByStudentEmailAndMealTypeAndDate(String studentEmail, String mealType, String date);
    List<MealSubmission> findByStudentEmail(String studentEmail);
}
