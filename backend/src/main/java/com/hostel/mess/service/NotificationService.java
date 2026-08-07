package com.hostel.mess.service;

import com.hostel.mess.model.Notification;
import com.hostel.mess.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository repository;

    @Autowired
    private WebSocketEventService wsService;

    public Notification createAndSend(String recipientEmail, String title, String message, String type, String link) {
        String cleanEmail = recipientEmail.toLowerCase().trim();
        Notification notification = new Notification(cleanEmail, title, message, type, link);
        Notification saved = repository.save(notification);
        
        wsService.sendNotification(cleanEmail, saved);
        return saved;
    }

    public Notification postAnnouncement(String title, String message, String link) {
        Notification notification = new Notification("all", title, message, "ANNOUNCEMENT", link);
        Notification saved = repository.save(notification);
        
        // Broadcast announcement to all users via universal channel
        wsService.broadcastAppEvent("ANNOUNCEMENT", saved);
        return saved;
    }

    public List<Notification> getUserNotifications(String email) {
        String cleanEmail = email.toLowerCase().trim();
        return repository.findByRecipientEmailInOrderByCreatedAtDesc(List.of(cleanEmail, "all"));
    }

    public long getUnreadCount(String email) {
        String cleanEmail = email.toLowerCase().trim();
        return repository.countByRecipientEmailInAndIsRead(List.of(cleanEmail, "all"), false);
    }

    public Notification markAsRead(String notificationId) {
        Optional<Notification> opt = repository.findById(notificationId);
        if (opt.isPresent()) {
            Notification n = opt.get();
            n.setRead(true);
            return repository.save(n);
        }
        throw new RuntimeException("Notification not found");
    }

    public void markAllAsRead(String email) {
        String cleanEmail = email.toLowerCase().trim();
        List<Notification> list = repository.findByRecipientEmailInOrderByCreatedAtDesc(List.of(cleanEmail, "all"));
        for (Notification n : list) {
            if (!n.isRead()) {
                n.setRead(true);
                repository.save(n);
            }
        }
    }

    public void deleteNotification(String notificationId) {
        repository.deleteById(notificationId);
    }
}
