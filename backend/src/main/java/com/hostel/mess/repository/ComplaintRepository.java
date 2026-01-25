package com.hostel.mess.repository;

import com.hostel.mess.model.Complaint;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends MongoRepository<Complaint, String> {
    List<Complaint> findByMealTypeAndDate(String mealType, String date);
    Optional<Complaint> findByMealTypeAndFoodItemAndDate(String mealType, String foodItem, String date);
    List<Complaint> findByMealType(String mealType);
}
