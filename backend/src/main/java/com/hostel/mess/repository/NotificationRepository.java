package com.hostel.mess.repository;

import com.hostel.mess.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByRecipientEmailInOrderByCreatedAtDesc(List<String> recipientEmails);
    long countByRecipientEmailInAndIsRead(List<String> recipientEmails, boolean isRead);
    List<Notification> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);
}
