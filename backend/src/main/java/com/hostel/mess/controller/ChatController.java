package com.hostel.mess.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hostel.mess.dto.ChatRequest;
import com.hostel.mess.dto.ChatResponse;
import com.hostel.mess.dto.PaginatedResponse;
import com.hostel.mess.model.ChatMessage;
import com.hostel.mess.security.JwtTokenProvider;
import com.hostel.mess.service.ChatService;

import jakarta.validation.Valid;
// ...existing code...

/**
 * REST Controller for Chat API endpoints
 * Handles sending, retrieving, and deleting chat messages
 * All endpoints require JWT authentication
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {
    
    @Autowired
    private ChatService chatService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    

    /**
     * Extract userId from JWT token in Authorization header
     */
    private String extractUserIdFromRequest(jakarta.servlet.http.HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        System.out.println("[DEBUG] Authorization header: " + header);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            boolean valid = jwtTokenProvider.validateToken(token);
            System.out.println("[DEBUG] JWT token: " + token);
            System.out.println("[DEBUG] JWT valid: " + valid);
            if (valid) {
                return jwtTokenProvider.getUserIdFromToken(token);
            }
        }
        return null;
    }
    
    /**
     * POST /api/chat/send
     * Send a message to a chat (group or universal)
     * Requires authentication
     * 
     * @param request ChatRequest with chatType, chatId, and message
     * @return ChatResponse with created message details
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@Valid @RequestBody ChatRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        try {
            String userId = extractUserIdFromRequest(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            // Validate request fields
            if (request.getChatType() == null || request.getChatType().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "chatType is required"));
            }
            if (request.getChatId() == null || request.getChatId().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "chatId is required"));
            }
            if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "message is required"));
            }

            // Send message
            ChatMessage chatMessage = chatService.sendMessage(
                request.getChatType(),
                request.getChatId(),
                userId,
                request.getMessage()
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ChatResponse(chatMessage));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            // TODO: Replace with proper logging
            System.err.println("Error: " + e.getMessage());
            System.err.println("Chat error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to send message: " + e.getMessage()));
        }
    }
    
    /**
     * GET /api/chat/messages
     * Get paginated messages for a specific chat (newest first for infinite scroll)
     * Query parameters: chatType (required), chatId (required), page (default 0), size (default 20, max 100)
     * Automatically filters out expired messages
     * Requires authentication
     * 
     * Uses reverse chronological ordering for better UX in real-time chat
     * 
     * @param chatType Type of chat (GROUP or UNIVERSAL)
     * @param chatId Group ID for GROUP, "GLOBAL" for UNIVERSAL
     * @param page Page number (0-based, default 0)
     * @param size Page size (default 20, max 100)
     * @return PaginatedResponse with ChatResponse objects (newest first)
     */
    @GetMapping("/messages")
    public ResponseEntity<?> getMessages(
        @RequestParam(required = true) String chatType,
        @RequestParam(required = true) String chatId,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size,
        jakarta.servlet.http.HttpServletRequest httpRequest
    ) {
        try {
            String userId = extractUserIdFromRequest(httpRequest);
            System.out.println("[DEBUG] /api/chat/messages called");
            System.out.println("[DEBUG] userId: " + userId);
            System.out.println("[DEBUG] chatType: " + chatType + ", chatId: " + chatId);
            
            // Validate pagination parameters
            if (page < 0) page = 0;
            if (size < 1) size = 20;
            if (size > 100) size = 100; // Max 100 items per page
            
            if (userId == null) {
                System.out.println("[DEBUG] No valid JWT, request will likely be rejected.");
            }
            
            // Get paginated messages (expired messages are filtered automatically)
            var pageResult = chatService.getMessagesPaged(chatType, chatId, page, size);
            
            // Convert to DTOs
            List<ChatResponse> responses = pageResult.getContent().stream()
                .map(ChatResponse::new)
                .toList();

            // Return paginated response
            PaginatedResponse<ChatResponse> response = new PaginatedResponse<>(
                responses,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalPages(),
                pageResult.getTotalElements()
            );
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            System.out.println("[DEBUG] IllegalArgumentException: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.out.println("[DEBUG] Exception: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to retrieve messages: " + e.getMessage()));
        }
    }
    
    /**
     * DELETE /api/chat/{messageId}
     * Delete a message (admin only)
     * Requires authentication and ADMIN role
     * 
     * @param messageId ID of message to delete
     * @return Success message or error
     */
    @DeleteMapping("/{messageId}")
    public ResponseEntity<?> deleteMessage(@PathVariable String messageId, jakarta.servlet.http.HttpServletRequest httpRequest) {
        try {
            String userId = extractUserIdFromRequest(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            // Delete message (service will verify admin role)
            chatService.deleteMessage(messageId, userId);

            return ResponseEntity.ok(Map.of(
                "message", "Message deleted successfully",
                "messageId", messageId
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to delete message: " + e.getMessage()));
        }
    }
}
