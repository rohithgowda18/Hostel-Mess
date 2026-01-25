package com.hostel.mess.repository;

import com.hostel.mess.model.Complaint;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;


import java.util.List;
import java.util.Optional;
import java.time.Instant;

@Repository
public interface ComplaintRepository extends MongoRepository<Complaint, String> {
        /**
         * Delete complaints older than a given timestamp
         * @param cutoff cutoff timestamp (e.g., 7 days ago)
         * @return number of deleted complaints
         */
        long deleteByCreatedAtBefore(Instant cutoff);
    List<Complaint> findByMealTypeAndDate(String mealType, String date);
    Optional<Complaint> findByMealTypeAndFoodItemAndDate(String mealType, String foodItem, String date);
    List<Complaint> findByMealType(String mealType);
}
