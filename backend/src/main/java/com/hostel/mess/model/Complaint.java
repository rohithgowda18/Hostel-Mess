package com.hostel.mess.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.HashSet;

@Document(collection = "food_complaints")
@CompoundIndex(name = "meal_date_idx", def = "{'mealType': 1, 'date': -1}")
@CompoundIndex(name = "status_updated_idx", def = "{'status': 1, 'updatedAt': -1}")
public class Complaint {
    @Id
    private String id;
    
    @Indexed
    private String mealType;
    
    @Indexed
    private String foodItem;
    
    @Indexed
    private String date; // yyyy-MM-dd format
    
    private List<String> reasons; // ["Poor taste", "Cold", "Oily", "Repeated often", "Undercooked/Overcooked", "Other"]
    private List<String> comments; // Optional comments from students
    
    private int complaintCount; // Total complaints raised
    private int agreeVotes; // 👍 Votes
    private int disagreeVotes; // 👎 Votes
    
    private Set<String> votedUserIds; // Track which users have voted to prevent duplicate votes
    
    @Indexed
    private String status; // PENDING, REMOVAL_REQUESTED, NEEDS_IMPROVEMENT, RESOLVED
    
    @Indexed(expireAfterSeconds = 604800) // 7 days auto-deletion
    private Instant createdAt;
    
    private Instant updatedAt;
    
    // Constructors
    public Complaint() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.complaintCount = 0;
        this.agreeVotes = 0;
        this.disagreeVotes = 0;
        this.status = "PENDING";
        this.votedUserIds = new HashSet<>();
    }
    
    public Complaint(String mealType, String foodItem, String date) {
        this();
        this.mealType = mealType;
        this.foodItem = foodItem;
        this.date = date;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getMealType() {
        return mealType;
    }
    
    public void setMealType(String mealType) {
        this.mealType = mealType;
    }
    
    public String getFoodItem() {
        return foodItem;
    }
    
    public void setFoodItem(String foodItem) {
        this.foodItem = foodItem;
    }
    
    public String getDate() {
        return date;
    }
    
    public void setDate(String date) {
        this.date = date;
    }
    
    public List<String> getReasons() {
        return reasons;
    }
    
    public void setReasons(List<String> reasons) {
        this.reasons = reasons;
    }
    
    public List<String> getComments() {
        return comments;
    }
    
    public void setComments(List<String> comments) {
        this.comments = comments;
    }
    
    public int getComplaintCount() {
        return complaintCount;
    }
    
    public void setComplaintCount(int complaintCount) {
        this.complaintCount = complaintCount;
    }
    
    public int getAgreeVotes() {
        return agreeVotes;
    }
    
    public void setAgreeVotes(int agreeVotes) {
        this.agreeVotes = agreeVotes;
    }
    
    public int getDisagreeVotes() {
        return disagreeVotes;
    }
    
    public void setDisagreeVotes(int disagreeVotes) {
        this.disagreeVotes = disagreeVotes;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
    
    public Instant getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public Set<String> getVotedUserIds() {
        return votedUserIds;
    }
    
    public void setVotedUserIds(Set<String> votedUserIds) {
        this.votedUserIds = votedUserIds;
    }
    
    public boolean hasUserVoted(String userId) {
        return votedUserIds != null && votedUserIds.contains(userId);
    }
    
    public void addVoter(String userId) {
        if (votedUserIds == null) {
            votedUserIds = new HashSet<>();
        }
        votedUserIds.add(userId);
    }
}

