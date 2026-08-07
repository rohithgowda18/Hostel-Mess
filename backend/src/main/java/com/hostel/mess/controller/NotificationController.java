package com.hostel.mess.controller;

import com.hostel.mess.model.Notification;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.UserRepository;
import com.hostel.mess.repository.NotificationRepository;
import com.hostel.mess.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class NotificationController {

    @Autowired
    private NotificationService service;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository repository;

    private String getEmailFromPrincipal(UserDetails userDetails) {
        if (userDetails == null) return null;
        User user = userRepository.findById(userDetails.getUsername()).orElse(null);
        return user != null ? user.getEmail() : null;
    }

    @GetMapping("/api/notifications")
    public ResponseEntity<?> getNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        String email = getEmailFromPrincipal(userDetails);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        List<Notification> notifications = service.getUserNotifications(email);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/api/notifications/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        String email = getEmailFromPrincipal(userDetails);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        long count = service.getUnreadCount(email);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/api/notifications/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        try {
            Notification n = service.markAsRead(id);
            return ResponseEntity.ok(n);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/api/notifications/read-all")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        String email = getEmailFromPrincipal(userDetails);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        service.markAllAsRead(email);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @DeleteMapping("/api/notifications/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable String id) {
        try {
            service.deleteNotification(id);
            return ResponseEntity.ok(Map.of("message", "Notification deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    // Announcements endpoints merged here
    @GetMapping("/api/announcements")
    public ResponseEntity<?> getAnnouncements() {
        List<Notification> list = repository.findByRecipientEmailOrderByCreatedAtDesc("all");
        return ResponseEntity.ok(list);
    }

    @PostMapping("/api/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> postAnnouncement(@RequestBody Map<String, String> body) {
        String title = body.get("title");
        String message = body.get("message");
        String link = body.get("link");
        if (title == null || message == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "title and message are required"));
        }
        Notification saved = service.postAnnouncement(title, message, link);
        return ResponseEntity.ok(saved);
    }
}
