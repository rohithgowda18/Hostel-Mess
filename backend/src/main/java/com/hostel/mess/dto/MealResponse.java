package com.hostel.mess.dto;

import java.util.List;


public class MealResponse {
    private String mealType;
    private String date;
    private List<String> items;
    private String postedAt;
    // Crowd moderation fields
    private int confirmations;
    private String verificationStatus; // UNVERIFIED, VERIFIED, UNCERTAIN
    // Time window info
    private boolean updateWindowOpen;
    private String updateWindowMessage;

    public MealResponse() {}

    public MealResponse(String mealType, String date, List<String> items, String postedAt, int confirmations, String verificationStatus, boolean updateWindowOpen, String updateWindowMessage) {
        this.mealType = mealType;
        this.date = date;
        this.items = items;
        this.postedAt = postedAt;
        this.confirmations = confirmations;
        this.verificationStatus = verificationStatus;
        this.updateWindowOpen = updateWindowOpen;
        this.updateWindowMessage = updateWindowMessage;
    }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public List<String> getItems() { return items; }
    public void setItems(List<String> items) { this.items = items; }

    public String getPostedAt() { return postedAt; }
    public void setPostedAt(String postedAt) { this.postedAt = postedAt; }

    public int getConfirmations() { return confirmations; }
    public void setConfirmations(int confirmations) { this.confirmations = confirmations; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public boolean isUpdateWindowOpen() { return updateWindowOpen; }
    public void setUpdateWindowOpen(boolean updateWindowOpen) { this.updateWindowOpen = updateWindowOpen; }

    public String getUpdateWindowMessage() { return updateWindowMessage; }
    public void setUpdateWindowMessage(String updateWindowMessage) { this.updateWindowMessage = updateWindowMessage; }

    @Override
    public String toString() {
        return "MealResponse{" +
                "mealType='" + mealType + '\'' +
                ", date='" + date + '\'' +
                ", items=" + items +
                ", postedAt='" + postedAt + '\'' +
                ", confirmations=" + confirmations +
                ", verificationStatus='" + verificationStatus + '\'' +
                ", updateWindowOpen=" + updateWindowOpen +
                ", updateWindowMessage='" + updateWindowMessage + '\'' +
                '}';
    }
}
