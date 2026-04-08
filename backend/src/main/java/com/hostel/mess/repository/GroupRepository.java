package com.hostel.mess.repository;

import com.hostel.mess.model.Group;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
import java.util.List;

public interface GroupRepository extends MongoRepository<Group, String> {
    Optional<Group> findByGroupCode(String groupCode);
    
    List<Group> findByMembersContaining(String userId);
    
    // Pagination support
    Page<Group> findByMembersContaining(String userId, Pageable pageable);
    Page<Group> findAll(Pageable pageable);
}
