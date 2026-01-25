package com.hostel.mess.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * ChatMessage model for group and universal chat
 * Stored in MongoDB collection 'chat_messages'
 */
import java.io.Serializable;

@Document(collection = "chat_messages")
@CompoundIndex(name = "chat_type_id_idx", def = "{'chatType': 1, 'chatId': 1}")
public class ChatMessage implements Serializable {
    
    @Id
    private String id;
    
    // ENUM: GROUP, UNIVERSAL
    private String chatType;
    
    // groupId for GROUP type, "GLOBAL" for UNIVERSAL type
    private String chatId;
    
    // User ID of message sender
    private String senderId;
    
    // Username of message sender (display name)
    private String senderName;
    
    // STUDENT or ADMIN
    private String senderRole;
    
    // Message content (max 150 chars for UNIVERSAL, unlimited for GROUP)
    private String message;
    
    // Timestamp when message was created
    private Instant createdAt;
    
    // Timestamp when message should be auto-deleted (for UNIVERSAL: 24h from creation)
    @Indexed(expireAfterSeconds = 0)
    private Instant expiresAt;
    
    // Constructors
    public ChatMessage() {
        this.createdAt = Instant.now();
    }
    
    public ChatMessage(String chatType, String chatId, String senderId, String senderName, 
                       String senderRole, String message, Instant expiresAt) {
        this();
        this.chatType = chatType;
        this.chatId = chatId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderRole = senderRole;
        this.message = message;
        this.expiresAt = expiresAt;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getChatType() {
        return chatType;
    }
    
    public void setChatType(String chatType) {
        this.chatType = chatType;
    }
    
    public String getChatId() {
        return chatId;
    }
    
    public void setChatId(String chatId) {
        this.chatId = chatId;
    }
    
    public String getSenderId() {
        return senderId;
    }
    
    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }
    
    public String getSenderName() {
        return senderName;
    }
    
    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }
    
    public String getSenderRole() {
        return senderRole;
    }
    
    public void setSenderRole(String senderRole) {
        this.senderRole = senderRole;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
    
    public Instant getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
}
