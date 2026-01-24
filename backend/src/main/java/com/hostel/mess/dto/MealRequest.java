package com.hostel.mess.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class MealRequest {

    @NotBlank(message = "Meal type is required")
    private String mealType; // BREAKFAST, LUNCH, SNACKS, DINNER

    @NotBlank(message = "Date is required")
    private String date; // Format: YYYY-MM-DD

    @NotEmpty(message = "At least one item must be selected")
    private List<String> items;
}
