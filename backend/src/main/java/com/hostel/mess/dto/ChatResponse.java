package com.hostel.mess.dto;

import com.hostel.mess.model.ChatMessage;
import java.time.Instant;

/**
 * DTO for returning chat messages in API responses
 * Used in GET /api/chat/messages responses
 */
public class ChatResponse {
    
    private String id;
    private String chatType;
    private String chatId;
    private String senderId;
    private String senderName;
    private String senderRole;
    private String message;
    private Instant createdAt;
    private Instant expiresAt;
    
    // Constructors
    public ChatResponse() {}
    
    public ChatResponse(ChatMessage chatMessage) {
        this.id = chatMessage.getId();
        this.chatType = chatMessage.getChatType();
        this.chatId = chatMessage.getChatId();
        this.senderId = chatMessage.getSenderId();
        this.senderName = chatMessage.getSenderName();
        this.senderRole = chatMessage.getSenderRole();
        this.message = chatMessage.getMessage();
        this.createdAt = chatMessage.getCreatedAt();
        this.expiresAt = chatMessage.getExpiresAt();
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
