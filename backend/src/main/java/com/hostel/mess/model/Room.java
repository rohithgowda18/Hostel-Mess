package com.hostel.mess.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "rooms")
@CompoundIndex(name = "block_room_idx", def = "{'block': 1, 'roomNumber': 1}", unique = true)
public class Room {
    @Id
    private String id;
    private String roomNumber;
    private String block;
    private Integer floor;
    private Integer capacity = 2; // Default capacity
    private Integer occupancy = 0; // Current count of students
    private String status = "VACANT"; // VACANT, OCCUPIED, UNKNOWN
    private Instant createdAt;
    private Instant updatedAt;

    public Room() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public Room(String roomNumber, String block, Integer floor, Integer capacity) {
        this.roomNumber = roomNumber;
        this.block = block;
        this.floor = floor;
        this.capacity = capacity;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.status = "VACANT";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getBlock() { return block; }
    public void setBlock(String block) { this.block = block; }

    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public Integer getOccupancy() { return occupancy; }
    public void setOccupancy(Integer occupancy) { this.occupancy = occupancy; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
