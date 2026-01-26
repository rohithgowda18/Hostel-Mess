package com.hostel.mess.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class BreakfastRequest {
    @NotBlank(message = "Date is required")
    private String date; // Format: YYYY-MM-DD
    @NotEmpty(message = "At least one item must be selected")
    private List<String> items;

    public BreakfastRequest() {}

    public BreakfastRequest(String date, List<String> items) {
        this.date = date;
        this.items = items;
    }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public List<String> getItems() { return items; }
    public void setItems(List<String> items) { this.items = items; }

    @Override
    public String toString() {
        return "BreakfastRequest{" +
                "date='" + date + '\'' +
                ", items=" + items +
                '}';
    }
}
