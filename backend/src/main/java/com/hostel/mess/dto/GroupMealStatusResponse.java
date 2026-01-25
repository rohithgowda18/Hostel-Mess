package com.hostel.mess.dto;

import java.time.Instant;
import java.util.List;

public class GroupMealStatusResponse {
    private String groupId;
    private String mealType;
    private List<String> goingUsers;
    private Integer goingCount;
    private Instant updatedAt;
    private Instant expiresAt;
    private Long secondsUntilExpiry;
    
    // Constructor
    public GroupMealStatusResponse() {}
    
    public GroupMealStatusResponse(String groupId, String mealType, List<String> goingUsers, 
                                    Instant updatedAt, Instant expiresAt) {
        this.groupId = groupId;
        this.mealType = mealType;
        this.goingUsers = goingUsers;
        this.goingCount = goingUsers != null ? goingUsers.size() : 0;
        this.updatedAt = updatedAt;
        this.expiresAt = expiresAt;
        this.secondsUntilExpiry = calculateSecondsUntilExpiry(expiresAt);
    }
    
    private Long calculateSecondsUntilExpiry(Instant expiresAt) {
        if (expiresAt == null) return 0L;
        long seconds = expiresAt.getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0, seconds);
    }
    
    // Getters and Setters
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
    
    public Integer getGoingCount() {
        return goingCount;
    }
    
    public void setGoingCount(Integer goingCount) {
        this.goingCount = goingCount;
    }
    
    public Instant getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public Instant getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public Long getSecondsUntilExpiry() {
        return secondsUntilExpiry;
    }
    
    public void setSecondsUntilExpiry(Long secondsUntilExpiry) {
        this.secondsUntilExpiry = secondsUntilExpiry;
    }
}
