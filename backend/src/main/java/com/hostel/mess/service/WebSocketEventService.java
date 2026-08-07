package com.hostel.mess.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class WebSocketEventService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast generic event message to a topic.
     */
    public void broadcast(String topic, Object payload) {
        try {
            messagingTemplate.convertAndSend(topic, payload);
        } catch (Exception e) {
            System.err.println("[WEBSOCKET ERROR] Failed to send to " + topic + ": " + e.getMessage());
        }
    }

    /**
     * Broadcast specific events wrapper.
     */
    public void broadcastAppEvent(String eventType, Object data) {
        broadcast("/topic/events", Map.of(
            "type", eventType,
            "data", data,
            "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * Send persistent notification directly via WS to user.
     */
    public void sendNotification(String userEmail, Object notification) {
        broadcast("/topic/notifications/" + userEmail.toLowerCase().trim(), notification);
    }
}
