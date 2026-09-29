package com.hostel.mess.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;

/**
 * JWT authentication interceptor for WebSocket STOMP connections.
 * Validates the JWT from the CONNECT frame's Authorization header and
 * populates the SecurityContext with full ROLE_ authorities.
 */
@Component
public class WebSocketAuthenticationHandler implements ChannelInterceptor {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        boolean wasCreated = false;

        if (accessor == null) {
            accessor = StompHeaderAccessor.wrap(message);
            wasCreated = true;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand()) || StompCommand.STOMP.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null) {
                authHeader = accessor.getFirstNativeHeader("authorization");
            }

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7).trim();
                try {
                    if (jwtService.validateToken(token)) {
                        String userId = jwtService.getUserIdFromToken(token);
                        UserDetails userDetails = customUserDetailsService.loadUserByUsername(userId);
                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                        accessor.setUser(auth);
                    }
                } catch (Exception e) {
                    System.err.println("[WS AUTH] Failed to authenticate STOMP session: " + e.getMessage());
                }
            }
        }

        return wasCreated
                ? MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders())
                : message;
    }
}
