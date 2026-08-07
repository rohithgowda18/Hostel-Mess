package com.hostel.mess.repository;

import com.hostel.mess.model.WeeklyMenu;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface WeeklyMenuRepository extends MongoRepository<WeeklyMenu, String> {
    Optional<WeeklyMenu> findByWeekStartDate(String weekStartDate);
}
