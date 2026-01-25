package com.hostel.mess.controller;

import com.hostel.mess.dto.UserInfo;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserRepository userRepository;

    // Get logged-in user's private profile
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
        User user = userOpt.get();
        UserInfo info = new UserInfo(user.getId(), user.getEmail(), user.getHostel(), user.getRoomNumber(), user.getYear(), user.getBranch(), user.getRole());
        return ResponseEntity.ok(info);
    }

    // Update logged-in user's profile (except email/role)
    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(@AuthenticationPrincipal UserDetails userDetails, @RequestBody UserInfo update) {
        String userId = userDetails.getUsername();
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
        User user = userOpt.get();
        user.setRoomNumber(update.getRoomNumber());
        user.setYear(update.getYear());
        user.setBranch(update.getBranch());
        userRepository.save(user);
        UserInfo info = new UserInfo(user.getId(), user.getEmail(), user.getHostel(), user.getRoomNumber(), user.getYear(), user.getBranch(), user.getRole());
        return ResponseEntity.ok(info);
    }

    // Get public profile by userId
    @GetMapping("/{userId}")
    public ResponseEntity<?> getPublicProfile(@PathVariable String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
        User user = userOpt.get();
        // Only public fields
        UserInfo info = new UserInfo(user.getId(), user.getEmail(), user.getHostel(), null, user.getYear(), user.getBranch(), user.getRole());
        return ResponseEntity.ok(info);
    }
}
