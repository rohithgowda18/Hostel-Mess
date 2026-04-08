package com.hostel.mess.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import com.hostel.mess.security.WebSocketAuthenticationHandler;

/**
 * WebSocket configuration for STOMP messaging
 * Configures message broker, STOMP endpoints, and topic subscriptions
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private WebSocketAuthenticationHandler authenticationHandler;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple message broker for sending messages to clients
        config.enableSimpleBroker("/topic", "/queue");
        
        // Set application destination prefix (client-to-server messages)
        config.setApplicationDestinationPrefixes("/app");
        
        // Set user destination prefix (private messages)
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register WebSocket endpoint with SockJS fallback
        registry.addEndpoint("/ws/connect")
                .setAllowedOrigins("*")
                .withSockJS()
                .setSessionCookieNeeded(false);
    }
}
