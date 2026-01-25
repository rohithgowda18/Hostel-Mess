package com.hostel.mess.repository;

import com.hostel.mess.model.Admin;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRepository extends MongoRepository<Admin, String> {
    Optional<Admin> findByUsername(String username);
    Optional<Admin> findByEmail(String email);
}
