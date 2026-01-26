package com.hostel.mess.dto;


import java.util.List;

public class BreakfastResponse {
    private String date;
    private List<String> items;
    private String postedAt;

    public BreakfastResponse() {}

    public BreakfastResponse(String date, List<String> items, String postedAt) {
        this.date = date;
        this.items = items;
        this.postedAt = postedAt;
    }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public List<String> getItems() { return items; }
    public void setItems(List<String> items) { this.items = items; }

    public String getPostedAt() { return postedAt; }
    public void setPostedAt(String postedAt) { this.postedAt = postedAt; }

    @Override
    public String toString() {
        return "BreakfastResponse{" +
                "date='" + date + '\'' +
                ", items=" + items +
                ", postedAt='" + postedAt + '\'' +
                '}';
    }
}
