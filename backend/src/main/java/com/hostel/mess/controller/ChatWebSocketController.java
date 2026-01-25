package com.hostel.mess.controller;

import com.hostel.mess.model.ChatMessage;
import com.hostel.mess.repository.ChatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
// ...existing code...
import org.springframework.stereotype.Controller;
import java.time.Instant;

/**
 * WebSocket controller for real-time universal chat
 */
@Controller
public class ChatWebSocketController {

    @Autowired
    private ChatRepository chatRepository;

    // ...existing code...

    /**
     * Handle incoming universal chat messages via WebSocket
     * Persists and broadcasts to /topic/universal
     */
    @MessageMapping("/universal") // /app/universal
    @SendTo("/topic/universal")
    public ChatMessage handleUniversalChat(ChatMessage message) {
        // Set required fields (simulate minimal user info, no auth)
        message.setChatType("UNIVERSAL");
        message.setChatId("GLOBAL");
        if (message.getCreatedAt() == null) message.setCreatedAt(Instant.now());
        if (message.getSenderName() == null) message.setSenderName("Anonymous");
        if (message.getSenderRole() == null) message.setSenderRole("STUDENT");
        if (message.getExpiresAt() == null) message.setExpiresAt(Instant.now().plusSeconds(24*3600));
        // Save to MongoDB
        ChatMessage saved = chatRepository.save(message);
        // Optionally, broadcast with messagingTemplate.convertAndSend if needed
        return saved;
    }
}