package com.hostel.mess.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public class MealRequest {
    @NotBlank(message = "Meal type is required")
    private String mealType; // BREAKFAST, LUNCH, SNACKS, DINNER
    @NotBlank(message = "Date is required")
    private String date; // Format: YYYY-MM-DD
    @NotEmpty(message = "At least one item must be selected")
    private List<String> items;

    public MealRequest() {}

    public MealRequest(String mealType, String date, List<String> items) {
        this.mealType = mealType;
        this.date = date;
        this.items = items;
    }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public List<String> getItems() { return items; }
    public void setItems(List<String> items) { this.items = items; }

    @Override
    public String toString() {
        return "MealRequest{" +
                "mealType='" + mealType + '\'' +
                ", date='" + date + '\'' +
                ", items=" + items +
                '}';
    }
}
