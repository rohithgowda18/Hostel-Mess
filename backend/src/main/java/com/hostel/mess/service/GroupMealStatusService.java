package com.hostel.mess.service;

import com.hostel.mess.model.Group;
import com.hostel.mess.model.GroupMealStatus;
import com.hostel.mess.repository.GroupMealStatusRepository;
import com.hostel.mess.repository.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class GroupMealStatusService {
    
    @Autowired
    private GroupMealStatusRepository groupMealStatusRepository;
    
    @Autowired
    private GroupRepository groupRepository;
    
    /**
     * Mark a user as going to a meal
     */
    public GroupMealStatus markUserGoing(String groupId, String mealType, String userId, String userEmail) {
        // Verify group exists and user is member
        Optional<Group> groupOpt = groupRepository.findById(groupId);
        if (groupOpt.isEmpty()) {
            throw new RuntimeException("Group not found");
        }
        
        Group group = groupOpt.get();
        // Check if user (by email or ID) is a member of the group
        boolean isMember = group.getMembers().contains(userEmail) || group.getMembers().contains(userId);
        if (!isMember) {
            throw new RuntimeException("User is not a member of this group");
        }
        
        // Get or create meal status
        Optional<GroupMealStatus> statusOpt = groupMealStatusRepository.findByGroupIdAndMealType(groupId, mealType);
        GroupMealStatus status;
        
        if (statusOpt.isPresent()) {
            status = statusOpt.get();
            // Check if expired
            if (status.isExpired()) {
                // Reset the status
                status.setGoingUsers(new ArrayList<>());
                status.setUpdatedAt(Instant.now());
            }
        } else {
            status = new GroupMealStatus(groupId, mealType, new ArrayList<>());
        }
        
        // Add user if not already there (use email for new entries, but support both)
        String identifierToStore = userEmail;
        if (!status.getGoingUsers().contains(identifierToStore) && !status.getGoingUsers().contains(userId)) {
            status.getGoingUsers().add(identifierToStore);
        }
        
        status.setUpdatedAt(Instant.now());
        return groupMealStatusRepository.save(status);
    }
    
    /**
     * Cancel user's going status for a meal
     */
    public GroupMealStatus cancelUserGoing(String groupId, String mealType, String userId) {
        Optional<GroupMealStatus> statusOpt = groupMealStatusRepository.findByGroupIdAndMealType(groupId, mealType);
        
        if (statusOpt.isEmpty()) {
            throw new RuntimeException("No going status found for this meal");
        }
        
        GroupMealStatus status = statusOpt.get();
        status.getGoingUsers().remove(userId);
        status.setUpdatedAt(Instant.now());
        
        return groupMealStatusRepository.save(status);
    }
    
    /**
     * Get group meal status
     */
    public GroupMealStatus getGroupMealStatus(String groupId, String mealType) {
        Optional<GroupMealStatus> statusOpt = groupMealStatusRepository.findByGroupIdAndMealType(groupId, mealType);
        
        if (statusOpt.isEmpty()) {
            // Return empty status if doesn't exist yet
            return new GroupMealStatus(groupId, mealType, new ArrayList<>());
        }
        
        GroupMealStatus status = statusOpt.get();
        
        // Check if expired
        if (status.isExpired()) {
            // Return empty status if expired
            return new GroupMealStatus(groupId, mealType, new ArrayList<>());
        }
        
        return status;
    }
}
