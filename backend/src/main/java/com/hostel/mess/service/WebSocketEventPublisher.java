package com.hostel.mess.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import com.hostel.mess.model.ChatMessage;
import com.hostel.mess.model.Complaint;
import lombok.extern.slf4j.Slf4j;

/**
 * Service to publish WebSocket events from REST layer
 * Broadcasts updates to all connected WebSocket clients
 */
@Service
@Slf4j
public class WebSocketEventPublisher {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Publish chat message to WebSocket subscribers
     */
    public void publishChatMessage(ChatMessage message) {
        try {
            String topic = "/topic/chat/" + message.getChatType().toLowerCase() + 
                          (message.getChatType().equals("GROUP") ? "/" + message.getChatId() : "");
            
            messagingTemplate.convertAndSend(topic, message);
            log.info("📤 Chat message published to: {}", topic);
        } catch (Exception e) {
            log.error("❌ Error publishing chat message: {}", e.getMessage());
        }
    }

    /**
     * Publish meal update to WebSocket subscribers
     */
    public void publishMealUpdate(String mealType, Object mealData) {
        try {
            String topic = "/topic/meals/" + mealType.toLowerCase();
            messagingTemplate.convertAndSend(topic, mealData);
            log.info("📤 Meal update published to: {}", topic);
        } catch (Exception e) {
            log.error("❌ Error publishing meal update: {}", e.getMessage());
        }
    }

    /**
     * Publish complaint vote update
     */
    public void publishComplaintVote(Complaint complaint) {
        try {
            messagingTemplate.convertAndSend("/topic/complaints", complaint);
            log.info("📤 Complaint vote published");
        } catch (Exception e) {
            log.error("❌ Error publishing complaint vote: {}", e.getMessage());
        }
    }

    /**
     * Publish group status update
     */
    public void publishGroupStatusUpdate(String groupId, Object statusData) {
        try {
            String topic = "/topic/groups/" + groupId;
            messagingTemplate.convertAndSend(topic, statusData);
            log.info("📤 Group status update published to: {}", topic);
        } catch (Exception e) {
            log.error("❌ Error publishing group status: {}", e.getMessage());
        }
    }

    /**
     * Send private message to specific user
     */
    public void sendUserMessage(String userId, String destination, Object message) {
        try {
            messagingTemplate.convertAndSendToUser(userId, destination, message);
            log.info("📤 Private message sent to user: {}", userId);
        } catch (Exception e) {
            log.error("❌ Error sending private message: {}", e.getMessage());
        }
    }
}
