package com.hostel.mess.service;

import com.hostel.mess.model.Room;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.RoomRepository;
import com.hostel.mess.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DirectoryService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void syncRoomOccupancy(String block, String roomNumber) {
        if (block == null || roomNumber == null) return;
        List<User> students = userRepository.findAll().stream()
                .filter(u -> block.equalsIgnoreCase(u.getHostel()) && roomNumber.equalsIgnoreCase(u.getRoomNumber()))
                .collect(Collectors.toList());

        Room room = roomRepository.findByBlockAndRoomNumber(block, roomNumber)
                .orElseGet(() -> {
                    // Lazy create room if needed
                    Room r = new Room(roomNumber, block, 1, 2);
                    if (students.size() > 0 && students.get(0).getFloor() != null) {
                        r.setFloor(students.get(0).getFloor());
                    }
                    return r;
                });

        room.setOccupancy(students.size());
        if (students.size() == 0) {
            room.setStatus("VACANT");
        } else {
            room.setStatus("OCCUPIED");
        }
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);

        // Broadcast real-time event to socket topic
        Map<String, Object> event = new HashMap<>();
        event.put("type", "ROOM_UPDATE");
        event.put("data", room);
        messagingTemplate.convertAndSend("/topic/events", event);
    }

    public List<Map<String, Object>> getHostelDirectoryTree() {
        // Sync database first for all active users to ensure correctness
        refreshAllOccupancy();

        List<Room> allRooms = roomRepository.findAll();
        // If empty, initialize realistic college hostel blocks (Freshers Block, Aryabhatta G, Aryabhatta F, Aryabhatta S, NNRI, PG)
        if (allRooms.isEmpty()) {
            String[][] blocks = {
                {"Freshers Block", "FR", "2"},
                {"Aryabhatta G", "G", "2"},
                {"Aryabhatta F", "F", "2"},
                {"Aryabhatta S", "S", "2"},
                {"NNRI Hostel", "NN", "1"},
                {"PG Hostel", "PG", "2"}
            };
            for (String[] bInfo : blocks) {
                String blockName = bInfo[0];
                String prefix = bInfo[1];
                int cap = Integer.parseInt(bInfo[2]);
                for (int floor = 1; floor <= 3; floor++) {
                    for (int num = 101; num <= 108; num++) {
                        String rNum = prefix + (floor * 100 + (num % 100));
                        Room r = new Room(rNum, blockName, floor, cap);
                        roomRepository.save(r);
                    }
                }
            }
            allRooms = roomRepository.findAll();
        }

        Map<String, Map<Integer, List<Room>>> blockMap = allRooms.stream()
                .collect(Collectors.groupingBy(
                        Room::getBlock,
                        Collectors.groupingBy(
                                Room::getFloor,
                                Collectors.toList()
                        )
                ));

        List<Map<String, Object>> result = new ArrayList<>();
        blockMap.forEach((block, floorMap) -> {
            Map<String, Object> blockData = new HashMap<>();
            blockData.put("block", block);

            List<Map<String, Object>> floorsList = new ArrayList<>();
            floorMap.forEach((floor, rooms) -> {
                Map<String, Object> floorData = new HashMap<>();
                floorData.put("floor", floor);
                rooms.sort(Comparator.comparing(Room::getRoomNumber));
                floorData.put("rooms", rooms);
                floorsList.add(floorData);
            });
            floorsList.sort(Comparator.comparing(m -> (Integer) m.get("floor")));
            blockData.put("floors", floorsList);
            result.add(blockData);
        });

        result.sort(Comparator.comparing(m -> (String) m.get("block")));
        return result;
    }

    public void refreshAllOccupancy() {
        List<User> allUsers = userRepository.findAll();
        List<Room> allRooms = roomRepository.findAll();

        Map<String, List<User>> studentMap = allUsers.stream()
                .filter(u -> u.getHostel() != null && u.getRoomNumber() != null)
                .collect(Collectors.groupingBy(u -> u.getHostel().toUpperCase() + "_" + u.getRoomNumber().toUpperCase()));

        // Also add rooms for any user whose room doesn't exist yet
        studentMap.forEach((key, students) -> {
            if (students.isEmpty()) return;
            User sample = students.get(0);
            String block = sample.getHostel();
            String roomNum = sample.getRoomNumber();
            Integer floor = sample.getFloor() != null ? sample.getFloor() : 1;

            Optional<Room> existing = roomRepository.findByBlockAndRoomNumber(block, roomNum);
            if (existing.isEmpty()) {
                Room newRoom = new Room(roomNum, block, floor, 2);
                roomRepository.save(newRoom);
            }
        });

        // Refresh all rooms count
        for (Room room : roomRepository.findAll()) {
            String key = room.getBlock().toUpperCase() + "_" + room.getRoomNumber().toUpperCase();
            List<User> students = studentMap.getOrDefault(key, Collections.emptyList());
            room.setOccupancy(students.size());
            room.setStatus(students.isEmpty() ? "VACANT" : "OCCUPIED");
            roomRepository.save(room);
        }
    }

    public Map<String, Object> getRoomDetails(String roomId, String requesterRole) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        List<User> occupants = userRepository.findAll().stream()
                .filter(u -> room.getBlock().equalsIgnoreCase(u.getHostel()) && room.getRoomNumber().equalsIgnoreCase(u.getRoomNumber()))
                .collect(Collectors.toList());

        List<Map<String, Object>> studentsList = occupants.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("year", u.getYear());
            m.put("branch", u.getBranch());

            boolean isVisible = u.getDirectoryVisible() != null ? u.getDirectoryVisible() : true;
            if (isVisible || "ADMIN".equalsIgnoreCase(requesterRole)) {
                m.put("name", u.getEmail().split("@")[0]); // Fallback display name
                m.put("email", u.getEmail());
                m.put("phoneNumber", u.getPhoneNumber());
                m.put("profilePhoto", u.getProfilePhoto());
            } else {
                m.put("name", "Occupied Student");
                m.put("email", "");
                m.put("phoneNumber", "");
                m.put("profilePhoto", "");
            }
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("room", room);
        response.put("occupants", studentsList);
        return response;
    }

    public Map<String, Object> getOccupancyStatistics() {
        refreshAllOccupancy();
        List<Room> rooms = roomRepository.findAll();
        List<User> students = userRepository.findAll();

        int totalRooms = rooms.size();
        long vacantRooms = rooms.stream().filter(r -> r.getOccupancy() == 0).count();
        long occupiedRooms = totalRooms - vacantRooms;

        int totalCapacity = rooms.stream().mapToInt(Room::getCapacity).sum();
        int occupiedBeds = rooms.stream().mapToInt(Room::getOccupancy).sum();
        int availableBeds = Math.max(0, totalCapacity - occupiedBeds);

        double occupancyPercentage = totalCapacity > 0 ? ((double) occupiedBeds / totalCapacity) * 100 : 0;

        // Statistics Groupings
        Map<Integer, Long> studentsPerFloor = rooms.stream()
                .collect(Collectors.groupingBy(Room::getFloor, Collectors.summingLong(Room::getOccupancy)));

        Map<String, Long> studentsPerYear = students.stream()
                .filter(s -> s.getYear() != null)
                .collect(Collectors.groupingBy(User::getYear, Collectors.counting()));

        Map<String, Long> studentsPerBranch = students.stream()
                .filter(s -> s.getBranch() != null)
                .collect(Collectors.groupingBy(User::getBranch, Collectors.counting()));

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRooms", totalRooms);
        stats.put("vacantRooms", vacantRooms);
        stats.put("occupiedRooms", occupiedRooms);
        stats.put("totalCapacity", totalCapacity);
        stats.put("availableBeds", availableBeds);
        stats.put("occupancyPercentage", Math.round(occupancyPercentage * 100.0) / 100.0);
        stats.put("studentsPerFloor", studentsPerFloor);
        stats.put("studentsPerYear", studentsPerYear);
        stats.put("studentsPerBranch", studentsPerBranch);

        return stats;
    }

    public void assignStudentToRoom(String studentId, String block, String roomNumber, Integer floor) {
        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        String oldBlock = user.getHostel();
        String oldRoomNumber = user.getRoomNumber();

        user.setHostel(block);
        user.setRoomNumber(roomNumber);
        if (floor != null) {
            user.setFloor(floor);
        }
        userRepository.save(user);

        // Sync old & new rooms
        syncRoomOccupancy(oldBlock, oldRoomNumber);
        syncRoomOccupancy(block, roomNumber);
    }

    public void vacateRoom(String roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        List<User> students = userRepository.findAll().stream()
                .filter(u -> room.getBlock().equalsIgnoreCase(u.getHostel()) && room.getRoomNumber().equalsIgnoreCase(u.getRoomNumber()))
                .collect(Collectors.toList());

        for (User u : students) {
            u.setHostel(null);
            u.setRoomNumber(null);
            userRepository.save(u);
        }

        room.setOccupancy(0);
        room.setStatus("VACANT");
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);

        // Broadcast event
        Map<String, Object> event = new HashMap<>();
        event.put("type", "ROOM_UPDATE");
        event.put("data", room);
        messagingTemplate.convertAndSend("/topic/events", event);
    }
}
