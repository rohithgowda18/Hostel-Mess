package com.hostel.mess.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String recipientEmail;
    private String recipientId;
    private String senderId;
    private String senderName;
    private String title;
    private String message;
    private String type; // FRIEND_REQUEST, FRIEND_REQUEST_ACCEPTED, MEAL_CALL, GROUP_MESSAGE, ADMIN_NOTICE, etc.
    private String notificationType;
    private String mealType; // For MEAL_CALL notifications (BREAKFAST, LUNCH, SNACKS, DINNER)
    private boolean isRead;
    private Instant createdAt;
    private String link; // Redirection link context

    public Notification() {
        this.createdAt = Instant.now();
        this.isRead = false;
    }

    public Notification(String recipientEmail, String title, String message, String type, String link) {
        this();
        this.recipientEmail = recipientEmail;
        this.title = title;
        this.message = message;
        this.type = type;
        this.notificationType = type;
        this.link = link;
    }

    public Notification(String recipientEmail, String recipientId, String senderId, String senderName,
                        String title, String message, String type, String mealType, String link) {
        this(recipientEmail, title, message, type, link);
        this.recipientId = recipientId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.mealType = mealType;
        this.notificationType = type;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRecipientEmail() { return recipientEmail; }
    public void setRecipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; }

    public String getRecipientId() { return recipientId; }
    public void setRecipientId(String recipientId) { this.recipientId = recipientId; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) {
        this.type = type;
        if (this.notificationType == null) {
            this.notificationType = type;
        }
    }

    public String getNotificationType() {
        return notificationType != null ? notificationType : type;
    }
    public void setNotificationType(String notificationType) {
        this.notificationType = notificationType;
        if (this.type == null) {
            this.type = notificationType;
        }
    }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }
}
