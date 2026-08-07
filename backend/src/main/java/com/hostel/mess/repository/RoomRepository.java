package com.hostel.mess.repository;

import com.hostel.mess.model.Room;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface RoomRepository extends MongoRepository<Room, String> {
    Optional<Room> findByBlockAndRoomNumber(String block, String roomNumber);
    List<Room> findByBlock(String block);
    List<Room> findByFloor(Integer floor);
    List<Room> findByBlockAndFloor(String block, Integer floor);
}
