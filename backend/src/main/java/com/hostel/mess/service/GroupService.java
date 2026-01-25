package com.hostel.mess.service;

import com.hostel.mess.model.Group;
import com.hostel.mess.repository.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class GroupService {
    
    @Autowired
    private GroupRepository groupRepository;
    
    private static final String CHAR_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // Uppercase + numbers only for WhatsApp compatibility
    private static final int CODE_LENGTH = 8; // 8-character code for sharing
    
    /**
     * Create a new group
     */
    public Group createGroup(String name, String userId) {
        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("Group name is required");
        }
        
        String groupCode = generateUniqueGroupCode();
        
        List<String> members = new ArrayList<>();
        members.add(userId);
        
        Group group = new Group(name, groupCode, members);
        return groupRepository.save(group);
    }
    
    /**
     * Join an existing group using group code
     */
    public Group joinGroup(String groupCode, String userId) {
        if (groupCode == null || groupCode.trim().isEmpty()) {
            throw new RuntimeException("Group code is required");
        }
        
        Optional<Group> groupOpt = groupRepository.findByGroupCode(groupCode.toUpperCase());
        if (groupOpt.isEmpty()) {
            throw new RuntimeException("Group not found with this code");
        }
        
        Group group = groupOpt.get();
        
        // Check if user already member
        if (group.getMembers().contains(userId)) {
            throw new RuntimeException("You are already a member of this group");
        }
        
        // Add user to group
        group.getMembers().add(userId);
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
