package com.hostel.mess.repository;

import com.hostel.mess.model.GroupMealStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface GroupMealStatusRepository extends MongoRepository<GroupMealStatus, String> {
    Optional<GroupMealStatus> findByGroupIdAndMealType(String groupId, String mealType);
}
