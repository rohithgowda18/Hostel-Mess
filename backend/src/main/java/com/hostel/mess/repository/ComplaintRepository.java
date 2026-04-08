package com.hostel.mess.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.hostel.mess.model.Complaint;

@Repository
public interface ComplaintRepository extends MongoRepository<Complaint, String> {
        /**
         * Delete complaints older than a given timestamp
         * @param cutoff cutoff timestamp (e.g., 7 days ago)
         * @return number of deleted complaints
         */
        long deleteByCreatedAtBefore(Instant cutoff);
    
    List<Complaint> findByMealTypeAndDate(String mealType, String date);
    List<Complaint> findByMealTypeAndDateOrderByUpdatedAtDesc(String mealType, String date);
    Optional<Complaint> findByMealTypeAndFoodItemAndDate(String mealType, String foodItem, String date);
    List<Complaint> findByMealType(String mealType);
    
    // Pagination support
    Page<Complaint> findByMealTypeAndDate(String mealType, String date, Pageable pageable);
    Page<Complaint> findByMealTypeAndDateOrderByUpdatedAtDesc(String mealType, String date, Pageable pageable);
    Page<Complaint> findAll(Pageable pageable);
    Page<Complaint> findByStatus(String status, Pageable pageable);
}
