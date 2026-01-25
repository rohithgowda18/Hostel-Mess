package com.hostel.mess.dto;

import java.util.List;

public class ComplaintRequest {
    private String mealType;
    private String foodItem;
    private List<String> reasons;
    private String comment;
    
    // Constructors
    public ComplaintRequest() {}
    
    public ComplaintRequest(String mealType, String foodItem, List<String> reasons, String comment) {
        this.mealType = mealType;
        this.foodItem = foodItem;
        this.reasons = reasons;
        this.comment = comment;
    }
    
    // Getters and Setters
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
    
    public List<String> getReasons() {
        return reasons;
    }
    
    public void setReasons(List<String> reasons) {
        this.reasons = reasons;
    }
    
    public String getComment() {
        return comment;
    }
    
    public void setComment(String comment) {
        this.comment = comment;
    }
}
