package com.hostel.mess.service;

import com.hostel.mess.model.Group;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.GroupRepository;
import com.hostel.mess.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
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
    
    private static final String CHAR_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // Uppercase + numbers only for WhatsApp compatibility
    private static final int CODE_LENGTH = 8; // 8-character code for sharing
    
    /**
     * Create a new group
     */
    public Group createGroup(String name, String userId) {
        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("Group name is required");
        }
        
        // Fetch user email from userId
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        String groupCode = generateUniqueGroupCode();
        
        List<String> members = new ArrayList<>();
        members.add(user.getEmail()); // Store email instead of userId
        
        Group group = new Group(name, groupCode, members, user.getEmail()); // Store creator as email
        return groupRepository.save(group);
    }
    
    /**
     * Join an existing group using group code
     */
    public Group joinGroup(String groupCode, String userId) {
        if (groupCode == null || groupCode.trim().isEmpty()) {
            throw new RuntimeException("Group code is required");
        }
        
        // Fetch user email from userId
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        Optional<Group> groupOpt = groupRepository.findByGroupCode(groupCode.toUpperCase());
        if (groupOpt.isEmpty()) {
            throw new RuntimeException("Group not found with this code");
        }
        
        Group group = groupOpt.get();
        String userEmail = user.getEmail();
        
        // Check if user already member
        if (group.getMembers().contains(userEmail)) {
            throw new RuntimeException("You are already a member of this group");
        }
        
        // Add user email to group
        group.getMembers().add(userEmail);
        return groupRepository.save(group);
    }
    
    /**
     * Get all groups for a user
     */
    public List<Group> getUserGroups(String userId) {
        return groupRepository.findByMembersContaining(userId);
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
    
    /**
     * Get paginated groups for a user
     * @param userId User ID
     * @param page Page number (0-based)
     * @param size Page size
     * @return Page of Group
     */
    public Page<Group> getUserGroupsPaged(String userId, int page, int size) {
        Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return groupRepository.findByMembersContaining(userId, pageable);
    }

    /**
     * Get paginated all groups (admin)
     * @param page Page number (0-based)
     * @param size Page size
     * @return Page of Group
     */
    public Page<Group> getAllGroupsPaged(int page, int size) {
        Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return groupRepository.findAll(pageable);
    }
    
    /**
     * Generate unique 8-character group code for sharing via WhatsApp
     */
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
}
