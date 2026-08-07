package com.hostel.mess.service;

import com.hostel.mess.model.Group;
import com.hostel.mess.model.User;
import com.hostel.mess.model.ChatMessage;
import com.hostel.mess.repository.GroupRepository;
import com.hostel.mess.repository.UserRepository;
import com.hostel.mess.repository.ChatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class GroupService {
    
    @Autowired
    private GroupRepository groupRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private WebSocketEventService wsService;
    
    private static final String CHAR_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 8;
    
    private static final int GROUP_CHAT_MESSAGE_MAX_LENGTH = 500;
    
    /**
     * Create a new group
     */
    public Group createGroup(String name, String userId) {
        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("Group name is required");
        }
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        String groupCode = generateUniqueGroupCode();
        
        List<String> members = new ArrayList<>();
        members.add(user.getEmail());
        
        Group group = new Group(name, groupCode, members, user.getEmail());
        return groupRepository.save(group);
    }
    
    /**
     * Join an existing group using group code
     */
    public Group joinGroup(String groupCode, String userId) {
        if (groupCode == null || groupCode.trim().isEmpty()) {
            throw new RuntimeException("Group code is required");
        }
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        Optional<Group> groupOpt = groupRepository.findByGroupCode(groupCode.toUpperCase());
        if (groupOpt.isEmpty()) {
            throw new RuntimeException("Group not found with this code");
        }
        
        Group group = groupOpt.get();
        String userEmail = user.getEmail();
        
        if (group.getMembers().contains(userEmail)) {
            throw new RuntimeException("You are already a member of this group");
        }
        
        group.getMembers().add(userEmail);
        return groupRepository.save(group);
    }
    
    /**
     * Get all groups for a user
     */
    public List<Group> getUserGroups(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        return groupRepository.findByMembersContaining(user.getEmail());
    }
    
    /**
     * Leave a group
     */
    public Group leaveGroup(String groupId, String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        Group group = getGroupDetails(groupId);
        String userEmail = user.getEmail();
        
        if (!group.getMembers().contains(userEmail)) {
            throw new RuntimeException("You are not a member of this group");
        }
        
        group.getMembers().remove(userEmail);
        
        if (group.getMembers().isEmpty()) {
            groupRepository.delete(group);
            return null;
        }
        
        if (userEmail.equals(group.getCreator())) {
            group.setCreator(group.getMembers().get(0));
        }
        
        return groupRepository.save(group);
    }
    
    /**
     * Get group details
     */
    public Group getGroupDetails(String groupId) {
        Optional<Group> groupOpt = groupRepository.findById(groupId);
        if (groupOpt.isEmpty()) {
            throw new RuntimeException("Group not found");
        }
        return groupOpt.get();
    }
    
    private String generateUniqueGroupCode() {
        Random random = new Random();
        String code;
        
        do {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 8; i++) {
                sb.append(CHAR_SET.charAt(random.nextInt(CHAR_SET.length())));
            }
            code = sb.toString();
        } while (groupRepository.findByGroupCode(code).isPresent());
        
        return code;
    }

    // Chat Message service logic merged into GroupService
    public ChatMessage sendMessage(String groupId, String senderId, String messageContent) {
        if (groupId == null || messageContent == null || senderId == null) {
            throw new IllegalArgumentException("Group ID, sender ID, and message are required");
        }
        
        String senderName = "Anonymous User";
        String senderRole = "STUDENT";
        Optional<User> userOpt = userRepository.findById(senderId);
        if (userOpt.isPresent()) {
            User sender = userOpt.get();
            senderName = sender.getEmail();
            senderRole = sender.getRole() != null ? sender.getRole() : "STUDENT";
        }
        
        if (messageContent.trim().isEmpty()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }
        
        if (messageContent.length() > GROUP_CHAT_MESSAGE_MAX_LENGTH) {
            throw new IllegalArgumentException(
                String.format("Message exceeds maximum length of %d characters", GROUP_CHAT_MESSAGE_MAX_LENGTH)
            );
        }
        
        Optional<Group> groupOpt = groupRepository.findById(groupId);
        if (groupOpt.isEmpty()) {
            throw new IllegalArgumentException("Group not found");
        }
        
        Instant now = Instant.now();
        Instant expiresAt = now.plus(3650, ChronoUnit.DAYS); // Group messages don't expire
        
        ChatMessage chatMessage = new ChatMessage(
            "GROUP",
            groupId,
            senderId,
            senderName,
            senderRole,
            messageContent,
            expiresAt
        );
        
        ChatMessage saved = chatRepository.save(chatMessage);
        wsService.broadcastAppEvent("CHAT_MESSAGE", saved);
        return saved;
    }

    public Page<ChatMessage> getMessagesPaged(String groupId, int page, int size) {
        Instant now = Instant.now();
        Pageable pageable = PageRequest.of(page, size);
        return chatRepository.findNonExpiredByChatTypeAndChatIdPaged("GROUP", groupId, now, pageable);
    }

    public void deleteMessage(String messageId, String adminId) {
        User admin = userRepository.findById(adminId)
            .orElseThrow(() -> new IllegalArgumentException("Admin user not found"));
        if (!"ADMIN".equals(admin.getRole())) {
            throw new IllegalArgumentException("Only admins can delete messages");
        }
        chatRepository.deleteById(messageId);
    }
}
