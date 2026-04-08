package com.hostel.mess.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import com.hostel.mess.model.ChatMessage;
import com.hostel.mess.service.ChatService;
import com.hostel.mess.service.WebSocketEventPublisher;
import lombok.extern.slf4j.Slf4j;

/**
 * WebSocket STOMP controller for real-time messaging
 * Handles incoming STOMP messages and broadcasts to subscribers
 */
@Controller
@Slf4j
public class WebSocketController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private WebSocketEventPublisher eventPublisher;

    /**
     * Handle group chat messages
     * Incoming: /app/chat/group/{groupId}
     * Outgoing: /topic/chat/group/{groupId}
     */
    @MessageMapping("/chat/group/{groupId}")
    @SendTo("/topic/chat/group/{groupId}")
    public ChatMessage handleGroupChat(
            @DestinationVariable String groupId,
            @Payload ChatMessage message,
            SimpMessageHeaderAccessor headerAccessor) {
        
        try {
            String userId = (String) headerAccessor.getSessionAttributes().get("userId");
            
            // Save to database via existing service
            // The service expects: chatType, chatId, senderId, message text
            ChatMessage savedMessage = chatService.sendMessage("GROUP", groupId, userId, message.getMessage());
            
            log.info("✅ Group chat message broadcast to /topic/chat/group/{}: {}", groupId, savedMessage.getId());
            return savedMessage;
        } catch (Exception e) {
            log.error("❌ Error handling group chat: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Handle community chat messages
     * Incoming: /app/chat/community
     * Outgoing: /topic/chat/community
     */
    @MessageMapping("/chat/community")
    @SendTo("/topic/chat/community")
    public ChatMessage handleCommunityChat(
            @Payload ChatMessage message,
            SimpMessageHeaderAccessor headerAccessor) {
        
        try {
            String userId = (String) headerAccessor.getSessionAttributes().get("userId");
            
            // Save to database via existing service
            // The service expects: chatType, chatId, senderId, message text
            ChatMessage savedMessage = chatService.sendMessage("COMMUNITY", "community", userId, message.getMessage());
            
            log.info("✅ Community chat message broadcast to /topic/chat/community: {}", savedMessage.getId());
            return savedMessage;
        } catch (Exception e) {
            log.error("❌ Error handling community chat: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Handle ping/pong for keep-alive
     * Incoming: /app/ping
     * Response sent to /user/{userId}/queue/pong
     */
    @MessageMapping("/ping")
    public void handlePing(SimpMessageHeaderAccessor headerAccessor) {
        try {
            String userId = (String) headerAccessor.getSessionAttributes().get("userId");
            eventPublisher.sendUserMessage(userId, "/queue/pong", "pong");
            log.debug("✅ Ping/pong keep-alive: {}", userId);
        } catch (Exception e) {
            log.error("❌ Error handling ping: {}", e.getMessage());
        }
    }

    /**
     * Connection monitoring - called when client connects
     */
    @MessageMapping("/connect")
    public void handleConnect(SimpMessageHeaderAccessor headerAccessor) {
        try {
            String userId = (String) headerAccessor.getSessionAttributes().get("userId");
            log.info("🟢 WebSocket client connected: {}", userId);
        } catch (Exception e) {
            log.error("❌ Error in connect handler: {}", e.getMessage());
        }
    }
}
