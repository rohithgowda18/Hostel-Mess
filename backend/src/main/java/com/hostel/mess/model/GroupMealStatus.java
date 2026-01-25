package com.hostel.mess.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;

@Document(collection = "group_meal_status")
public class GroupMealStatus {
    @Id
    private String id;
    
    private String groupId;
    private String mealType; // BREAKFAST, LUNCH, SNACKS, DINNER
    private List<String> goingUsers; // User IDs going to this meal
    private Instant updatedAt;
    private Instant expiresAt; // 30 minutes after updatedAt
    
    // Constructors
    public GroupMealStatus() {
        this.updatedAt = Instant.now();
        this.expiresAt = Instant.now().plusSeconds(30 * 60); // 30 minutes
    }
    
    public GroupMealStatus(String groupId, String mealType, List<String> goingUsers) {
        this();
        this.groupId = groupId;
        this.mealType = mealType;
        this.goingUsers = goingUsers;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getGroupId() {
        return groupId;
    }
    
    public void setGroupId(String groupId) {
        this.groupId = groupId;
    }
    
    public String getMealType() {
        return mealType;
    }
    
    public void setMealType(String mealType) {
        this.mealType = mealType;
    }
    
    public List<String> getGoingUsers() {
        return goingUsers;
    }
    
    public void setGoingUsers(List<String> goingUsers) {
        this.goingUsers = goingUsers;
    }
    
    public Instant getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
        this.expiresAt = updatedAt.plusSeconds(30 * 60); // Reset expiry time
    }
    
    public Instant getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
}
