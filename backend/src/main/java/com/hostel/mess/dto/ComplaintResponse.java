package com.hostel.mess.dto;

import java.util.List;

public class ComplaintResponse {
    private String id;
    private String mealType;
    private String foodItem;
    private String date;
    
    private List<String> reasons;
    private List<String> comments;
    
    private int complaintCount;
    private int agreeVotes;
    private int disagreeVotes;
    
    private String status;
    private double agreePercentage;
    
    // Constructors
    public ComplaintResponse() {}
    
    public ComplaintResponse(String id, String mealType, String foodItem, String date,
                            List<String> reasons, List<String> comments,
                            int complaintCount, int agreeVotes, int disagreeVotes,
                            String status) {
        this.id = id;
        this.mealType = mealType;
        this.foodItem = foodItem;
        this.date = date;
        this.reasons = reasons;
        this.comments = comments;
        this.complaintCount = complaintCount;
        this.agreeVotes = agreeVotes;
        this.disagreeVotes = disagreeVotes;
        this.status = status;
        this.agreePercentage = calculateAgreePercentage();
    }
    
    private double calculateAgreePercentage() {
        int totalVotes = agreeVotes + disagreeVotes;
        if (totalVotes == 0) return 0;
        return (double) agreeVotes / totalVotes * 100;
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
    
    public double getAgreePercentage() {
        return agreePercentage;
    }
    
    public void setAgreePercentage(double agreePercentage) {
        this.agreePercentage = agreePercentage;
    }
}
