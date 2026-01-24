package com.hostel.mess.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BreakfastRequest {

    @NotBlank(message = "Date is required")
    private String date; // Format: YYYY-MM-DD

    @NotEmpty(message = "At least one item must be selected")
    private List<String> items;
}
