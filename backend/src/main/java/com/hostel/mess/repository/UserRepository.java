package com.hostel.mess.repository;

import com.hostel.mess.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Repository for User operations in MongoDB
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    /**
     * Find user by email
     * @param email User's email
     * @return Optional containing user if found
     */
    Optional<User> findByEmail(String email);


    boolean existsByEmail(String email);

}
