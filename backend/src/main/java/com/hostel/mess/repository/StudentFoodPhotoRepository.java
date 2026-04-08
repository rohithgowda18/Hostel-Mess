package com.hostel.mess.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.hostel.mess.model.StudentFoodPhoto;

@Repository
public interface StudentFoodPhotoRepository extends MongoRepository<StudentFoodPhoto, String> {
    List<StudentFoodPhoto> findByDate(String date);
}
