package com.hostel.mess.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "breakfast_updates")
public class BreakfastUpdate {
    @Id
    private String id;
    private String date; // Format: YYYY-MM-DD
    private List<String> items;
    private Instant postedAt;

    public BreakfastUpdate() {}

    public BreakfastUpdate(String id, String date, List<String> items, Instant postedAt) {
        this.id = id;
        this.date = date;
        this.items = items;
        this.postedAt = postedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public List<String> getItems() { return items; }
    public void setItems(List<String> items) { this.items = items; }

    public Instant getPostedAt() { return postedAt; }
    public void setPostedAt(Instant postedAt) { this.postedAt = postedAt; }

    @Override
    public String toString() {
        return "BreakfastUpdate{" +
                "id='" + id + '\'' +
                ", date='" + date + '\'' +
                ", items=" + items +
                ", postedAt=" + postedAt +
                '}';
    }
}
