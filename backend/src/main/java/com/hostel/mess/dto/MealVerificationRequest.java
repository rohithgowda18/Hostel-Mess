package com.hostel.mess.dto;

public class MealVerificationRequest {
    private String mealType;
    private String date;
    private boolean verified;

    public MealVerificationRequest() {}

    public MealVerificationRequest(String mealType, String date, boolean verified) {
        this.mealType = mealType;
        this.date = date;
        this.verified = verified;
    }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
}
