package com.hostel.mess.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

/**
 * JWT authentication interceptor for WebSocket STOMP connections
 * Validates JWT token from CONNECT frame headers
 */
@Component
public class WebSocketAuthenticationHandler implements ChannelInterceptor {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Extract Bearer token from Authorization header
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    String token = authHeader.substring(7); // Remove "Bearer " prefix
                    
                    // Validate token
                    if (jwtTokenProvider.validateToken(token)) {
                        String userId = jwtTokenProvider.getUserIdFromToken(token);
                        
                        // Set authentication context
                        UsernamePasswordAuthenticationToken auth = 
                            new UsernamePasswordAuthenticationToken(userId, null, new ArrayList<>());
                        
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        accessor.setUser(auth);
                        
                        System.out.println("✅ WebSocket authenticated for user: " + userId);
                    } else {
                        throw new SecurityException("Invalid JWT token");
                    }
                } catch (Exception e) {
                    System.err.println("❌ WebSocket authentication error: " + e.getMessage());
                    throw new SecurityException("Authentication failed: " + e.getMessage());
                }
            } else {
                throw new SecurityException("Missing Authorization header");
            }
        }
        
        return message;
    }
}
