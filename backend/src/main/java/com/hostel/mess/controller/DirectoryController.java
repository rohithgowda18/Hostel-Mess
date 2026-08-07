package com.hostel.mess.controller;

import com.hostel.mess.model.Room;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.RoomRepository;
import com.hostel.mess.repository.UserRepository;
import com.hostel.mess.service.DirectoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class DirectoryController {

    @Autowired
    private DirectoryService directoryService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    // Retrieve full directory structure
    @GetMapping("/directory")
    public ResponseEntity<?> getDirectoryTree() {
        return ResponseEntity.ok(directoryService.getHostelDirectoryTree());
    }

    // Lazy load room occupants and details
    @GetMapping("/directory/room/{roomId}")
    public ResponseEntity<?> getRoomDetails(
            @PathVariable String roomId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        String requesterRole = userDetails.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .findFirst().orElse("STUDENT");
                
        try {
            return ResponseEntity.ok(directoryService.getRoomDetails(roomId, requesterRole));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Search rooms with optional filters
    @GetMapping("/directory/search")
    public ResponseEntity<?> searchRooms(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String block,
            @RequestParam(required = false) Integer floor,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String branch) {

        directoryService.refreshAllOccupancy();
        List<Room> rooms = roomRepository.findAll();
        List<User> students = userRepository.findAll();

        // Apply filters on Rooms first
        if (block != null && !block.isEmpty()) {
            rooms = rooms.stream().filter(r -> block.equalsIgnoreCase(r.getBlock())).collect(Collectors.toList());
        }
        if (floor != null) {
            rooms = rooms.stream().filter(r -> floor.equals(r.getFloor())).collect(Collectors.toList());
        }
        if (status != null && !status.isEmpty()) {
            rooms = rooms.stream().filter(r -> status.equalsIgnoreCase(r.getStatus())).collect(Collectors.toList());
        }

        // Filter based on Student parameters (branch, year, student name)
        if ((query != null && !query.isEmpty()) || (year != null && !year.isEmpty()) || (branch != null && !branch.isEmpty())) {
            Set<String> matchingRoomKeys = new HashSet<>();

            for (User u : students) {
                if (u.getHostel() == null || u.getRoomNumber() == null) continue;

                boolean matchesQuery = true;
                if (query != null && !query.isEmpty()) {
                    String q = query.toLowerCase();
                    boolean matchesName = u.getDirectoryVisible() != null && u.getDirectoryVisible() && u.getEmail().toLowerCase().contains(q);
                    boolean matchesRoom = u.getRoomNumber().toLowerCase().contains(q);
                    matchesQuery = matchesName || matchesRoom;
                }

                boolean matchesYear = year == null || year.isEmpty() || year.equalsIgnoreCase(u.getYear());
                boolean matchesBranch = branch == null || branch.isEmpty() || branch.equalsIgnoreCase(u.getBranch());

                if (matchesQuery && matchesYear && matchesBranch) {
                    matchingRoomKeys.add(u.getHostel().toUpperCase() + "_" + u.getRoomNumber().toUpperCase());
                }
            }

            rooms = rooms.stream()
                    .filter(r -> matchingRoomKeys.contains(r.getBlock().toUpperCase() + "_" + r.getRoomNumber().toUpperCase()))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(rooms);
    }

    // Toggle Directory Visibility for student
    @PutMapping("/directory/visibility")
    public ResponseEntity<?> toggleVisibility(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam boolean visible) {
        String userId = userDetails.getUsername();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        user.setDirectoryVisible(visible);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Visibility updated successfully", "visible", visible));
    }

    // ADMIN: Get stats
    @GetMapping("/admin/occupancy-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(directoryService.getOccupancyStatistics());
    }

    // ADMIN: Create/Configure a room
    @PostMapping("/admin/rooms")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addRoom(@RequestBody Room room) {
        Optional<Room> existing = roomRepository.findByBlockAndRoomNumber(room.getBlock(), room.getRoomNumber());
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Room already exists in this block"));
        }
        room.setOccupancy(0);
        room.setStatus("VACANT");
        roomRepository.save(room);
        return ResponseEntity.status(201).body(room);
    }

    // ADMIN: Assign student to a room
    @PutMapping("/admin/rooms/{roomId}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignStudent(
            @PathVariable String roomId,
            @RequestParam String studentId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        // Check Capacity limit
        if (room.getOccupancy() >= room.getCapacity()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Room capacity exceeded"));
        }

        directoryService.assignStudentToRoom(studentId, room.getBlock(), room.getRoomNumber(), room.getFloor());
        return ResponseEntity.ok(Map.of("message", "Student assigned successfully"));
    }

    // ADMIN: Vacate a room completely
    @DeleteMapping("/admin/rooms/{roomId}/vacate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> vacateRoom(@PathVariable String roomId) {
        directoryService.vacateRoom(roomId);
        return ResponseEntity.ok(Map.of("message", "Room vacated successfully"));
    }

    // ADMIN: Find students search list
    @GetMapping("/admin/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getStudentsList(@RequestParam(required = false) String query) {
        List<User> users = userRepository.findAll().stream()
                .filter(u -> !"ADMIN".equalsIgnoreCase(u.getRole()))
                .collect(Collectors.toList());

        if (query != null && !query.trim().isEmpty()) {
            String q = query.toLowerCase();
            users = users.stream()
                    .filter(u -> u.getEmail().toLowerCase().contains(q) || 
                                (u.getRoomNumber() != null && u.getRoomNumber().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(users);
    }

    // ADMIN: Download CSV report
    @GetMapping("/admin/occupancy-report")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> downloadReport() {
        directoryService.refreshAllOccupancy();
        List<Room> rooms = roomRepository.findAll();

        StringBuilder csv = new StringBuilder();
        csv.append("Room ID,Block,Floor,Room Number,Capacity,Occupancy,Status\n");

        for (Room r : rooms) {
            csv.append(String.format("%s,%s,%d,%s,%d,%d,%s\n",
                    r.getId(), r.getBlock(), r.getFloor(), r.getRoomNumber(), r.getCapacity(), r.getOccupancy(), r.getStatus()));
        }

        byte[] data = csv.toString().getBytes();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=hostel_occupancy_report.csv")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }
}
