package com.hostel.mess.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.hostel.mess.model.User;

/**
 * Repository for User operations in MongoDB
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /**
     * Find user by email
     *
     * @param email User's email
     * @return Optional containing user if found
     */
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("{ 'role': 'STUDENT', 'directoryVisible': { '$ne': false }, 'email': { '$regex': ?0, '$options': 'i' } }")
    List<User> searchVisibleStudentsByEmail(String emailPattern, Pageable pageable);

}
