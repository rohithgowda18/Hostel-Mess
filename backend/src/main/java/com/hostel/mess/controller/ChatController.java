package com.hostel.mess.controller;

import com.hostel.mess.dto.ChatRequest;
import com.hostel.mess.dto.ChatResponse;
import com.hostel.mess.model.ChatMessage;
import com.hostel.mess.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST Controller for Chat API endpoints
 * Handles sending, retrieving, and deleting chat messages
 * All endpoints require JWT authentication
 */
@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "https://rohithgowda18.github.io", "https://hostel-mess-one.vercel.app"})
public class ChatController {
    
    @Autowired
    private ChatService chatService;
    
    /**
     * Get authenticated user ID - Disabled (no auth required)
     * 
     * @return User ID
     */
    private String getAuthenticatedUserId() {
        return "default-user";
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
    public ResponseEntity<?> sendMessage(@Valid @RequestBody ChatRequest request) {
        try {
            String userId = getAuthenticatedUserId();
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
            e.printStackTrace();
            System.err.println("Chat error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to send message: " + e.getMessage()));
        }
    }
    
    /**
     * GET /api/chat/messages
     * Get all messages for a specific chat
     * Query parameters: chatType (required), chatId (required)
     * Automatically filters out expired messages
     * Requires authentication
     * 
     * @param chatType Type of chat (GROUP or UNIVERSAL)
     * @param chatId Group ID for GROUP, "GLOBAL" for UNIVERSAL
     * @return List of ChatResponse objects
     */
    @GetMapping("/messages")
    public ResponseEntity<?> getMessages(
        @RequestParam(required = true) String chatType,
        @RequestParam(required = true) String chatId
    ) {
        try {
            String userId = getAuthenticatedUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }
            
            // Validate access for group chats
            if ("GROUP".equals(chatType)) {
                if (!chatService.isUserMemberOfGroup(userId, chatId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You don't have access to this group chat"));
                }
            }
            
            // Get messages (expired messages are filtered automatically)
            List<ChatMessage> messages = chatService.getMessages(chatType, chatId);
            List<ChatResponse> responses = messages.stream()
                .map(ChatResponse::new)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(responses);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
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
    public ResponseEntity<?> deleteMessage(@PathVariable String messageId) {
        try {
            String userId = getAuthenticatedUserId();
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
