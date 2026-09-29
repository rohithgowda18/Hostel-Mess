package com.hostel.mess.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.hostel.mess.model.MealPhoto;

@Repository
public interface MealPhotoRepository extends MongoRepository<MealPhoto, String> {
    List<MealPhoto> findByDate(String date);
    List<MealPhoto> findByDateAndMealTypeOrderByUploadedAtDesc(String date, String mealType);
    List<MealPhoto> findByDateAndMealType(String date, String mealType);
}
