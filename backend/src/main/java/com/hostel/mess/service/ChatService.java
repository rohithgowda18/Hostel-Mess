package com.hostel.mess.service;

import com.hostel.mess.model.ChatMessage;
import com.hostel.mess.model.Group;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.ChatRepository;
import com.hostel.mess.repository.GroupRepository;
import com.hostel.mess.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

/**
 * Service for handling chat operations
 * Manages sending, retrieving, and deleting messages
 * Handles message validation and expiration
 */
@Service
public class ChatService {
    
    @Autowired
    private ChatRepository chatRepository;
    
    @Autowired
    private GroupRepository groupRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // Constants
    private static final int UNIVERSAL_CHAT_MESSAGE_MAX_LENGTH = 150;
    private static final int GROUP_CHAT_MESSAGE_MAX_LENGTH = 500;
    private static final String UNIVERSAL_CHAT_ID = "GLOBAL";
    private static final String CHAT_TYPE_GROUP = "GROUP";
    private static final String CHAT_TYPE_UNIVERSAL = "UNIVERSAL";
    
    /**
     * Send a message to a chat
     * 
     * @param chatType Type of chat (GROUP or UNIVERSAL)
     * @param chatId Group ID for GROUP, "GLOBAL" for UNIVERSAL
     * @param senderId User ID of sender
     * @param message Message content
     * @return Created ChatMessage
     * @throws IllegalArgumentException if validation fails
     */
    public ChatMessage sendMessage(String chatType, String chatId, String senderId, String message) {
        
        // Validate inputs
        if (chatType == null || message == null || senderId == null || chatId == null) {
            throw new IllegalArgumentException("Chat type, chat ID, sender ID, and message are required");
        }
        
        // Get sender user info - fallback to default if not found (auth disabled)
        String senderName = "Anonymous User";
        String senderRole = "STUDENT";
        Optional<User> userOpt = userRepository.findById(senderId);
        if (userOpt.isPresent()) {
            User sender = userOpt.get();
            senderName = sender.getName();
            senderRole = sender.getRole() != null ? sender.getRole() : "STUDENT";
        }
        
        // Validate chat type
        if (!chatType.equals(CHAT_TYPE_GROUP) && !chatType.equals(CHAT_TYPE_UNIVERSAL)) {
            throw new IllegalArgumentException("Invalid chat type. Must be GROUP or UNIVERSAL");
        }
        
        // Validate message length based on chat type
        int maxLength = chatType.equals(CHAT_TYPE_UNIVERSAL) 
            ? UNIVERSAL_CHAT_MESSAGE_MAX_LENGTH 
            : GROUP_CHAT_MESSAGE_MAX_LENGTH;
        
        if (message.trim().isEmpty()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }
        
        if (message.length() > maxLength) {
            throw new IllegalArgumentException(
                String.format("Message exceeds maximum length of %d characters", maxLength)
            );
        }
        
        // Validate access
        if (chatType.equals(CHAT_TYPE_GROUP)) {
            // Check if user is member of the group
            Optional<Group> groupOpt = groupRepository.findById(chatId);
            if (!groupOpt.isPresent()) {
                throw new IllegalArgumentException("Group not found");
            }
            
            Group group = groupOpt.get();
            if (!group.getMembers().contains(senderId)) {
                throw new IllegalArgumentException("User is not a member of this group");
            }
        }
        
        // Create message
        Instant now = Instant.now();
        Instant expiresAt;
        
        // Set expiration time based on chat type
        if (chatType.equals(CHAT_TYPE_UNIVERSAL)) {
            // Universal chat messages expire after 24 hours
            expiresAt = now.plus(24, ChronoUnit.HOURS);
        } else {
            // Group chat messages don't expire (set to far future)
            expiresAt = now.plus(10, ChronoUnit.YEARS);
        }
        
        ChatMessage chatMessage = new ChatMessage(
            chatType,
            chatId,
            senderId,
            senderName,
            senderRole,
            message,
            expiresAt
        );
        
        return chatRepository.save(chatMessage);
    }
    
    /**
     * Get all messages for a chat (filtered by type and ID)
     * Automatically filters out expired messages
     * 
     * @param chatType Type of chat (GROUP or UNIVERSAL)
     * @param chatId Group ID for GROUP, "GLOBAL" for UNIVERSAL
     * @return List of non-expired messages ordered by creation time
     */
    public List<ChatMessage> getMessages(String chatType, String chatId) {
        
        if (chatType == null || chatId == null) {
            throw new IllegalArgumentException("Chat type and chat ID are required");
        }
        
        Instant now = Instant.now();
        return chatRepository.findNonExpiredByChatTypeAndChatIdSorted(chatType, chatId, now);
    }
    
    /**
     * Get all messages for a chat without expiration filtering
     * Used for admin purposes
     * 
     * @param chatType Type of chat (GROUP or UNIVERSAL)
     * @param chatId Group ID for GROUP, "GLOBAL" for UNIVERSAL
     * @return List of all messages ordered by creation time
     */
    public List<ChatMessage> getAllMessages(String chatType, String chatId) {
        
        if (chatType == null || chatId == null) {
            throw new IllegalArgumentException("Chat type and chat ID are required");
        }
        
        return chatRepository.findByChatTypeAndChatIdOrderByCreatedAtAsc(chatType, chatId);
    }
    
    /**
     * Delete a message (admin only)
     * 
     * @param messageId ID of message to delete
     * @param adminId ID of admin performing deletion
     * @throws IllegalArgumentException if message not found or user is not admin
     */
    public void deleteMessage(String messageId, String adminId) {
        
        // Verify admin user
        Optional<User> adminOpt = userRepository.findById(adminId);
        if (!adminOpt.isPresent()) {
            throw new IllegalArgumentException("Admin user not found");
        }
        
        User admin = adminOpt.get();
        if (!"ADMIN".equals(admin.getRole())) {
            throw new IllegalArgumentException("Only admins can delete messages");
        }
        
        // Delete message
        chatRepository.deleteById(messageId);
    }
    
    /**
     * Check if user is member of a group
     * 
     * @param userId User ID to check
     * @param groupId Group ID to check
     * @return true if user is member, false otherwise
     */
    public boolean isUserMemberOfGroup(String userId, String groupId) {
        Optional<Group> groupOpt = groupRepository.findById(groupId);
        if (!groupOpt.isPresent()) {
            return false;
        }
        return groupOpt.get().getMembers().contains(userId);
    }
    
    /**
     * Check if a message exists and get it
     * 
     * @param messageId Message ID to retrieve
     * @return Optional containing the message if found
     */
    public Optional<ChatMessage> getMessageById(String messageId) {
        return chatRepository.findById(messageId);
    }
}
