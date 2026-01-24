package com.hostel.mess.repository;

import com.hostel.mess.model.BreakfastUpdate;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BreakfastRepository extends MongoRepository<BreakfastUpdate, String> {

    Optional<BreakfastUpdate> findByDate(String date);
}
