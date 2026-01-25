package com.hostel.mess.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for sending chat messages
 * Used in POST /api/chat/send
 */
public class ChatRequest {
    
    @NotBlank(message = "Chat type is required")
    private String chatType; // GROUP or UNIVERSAL
    
    @NotBlank(message = "Chat ID is required")
    private String chatId; // groupId for GROUP, "GLOBAL" for UNIVERSAL
    
    @NotBlank(message = "Message cannot be empty")
    @Size(min = 1, max = 500, message = "Message must be between 1 and 500 characters")
    private String message;
    
    // Constructors
    public ChatRequest() {}
    
    public ChatRequest(String chatType, String chatId, String message) {
        this.chatType = chatType;
        this.chatId = chatId;
        this.message = message;
    }
    
    // Getters and Setters
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
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
}
