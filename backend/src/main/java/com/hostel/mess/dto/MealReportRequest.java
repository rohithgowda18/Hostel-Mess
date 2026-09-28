package com.hostel.mess.dto;

import java.util.List;

public class MealReportRequest {
    private String mealType;
    private String date;
    private List<String> selectedItems;
    private String photoUrl;

    public MealReportRequest() {}

    public MealReportRequest(String mealType, String date, List<String> selectedItems, String photoUrl) {
        this.mealType = mealType;
        this.date = date;
        this.selectedItems = selectedItems;
        this.photoUrl = photoUrl;
    }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public List<String> getSelectedItems() { return selectedItems; }
    public void setSelectedItems(List<String> selectedItems) { this.selectedItems = selectedItems; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
}
