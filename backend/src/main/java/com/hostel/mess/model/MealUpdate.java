package com.hostel.mess.model;

import java.time.Instant;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;


@Document(collection = "meal_updates")
@CompoundIndex(name = "meal_date_idx", def = "{'mealType': 1, 'date': 1}", unique = true)
public class MealUpdate {
    @Id
    private String id;
    private String mealType; // BREAKFAST, LUNCH, SNACKS, DINNER
    private String date; // Format: YYYY-MM-DD
    private List<String> items;
    private Instant postedAt;
    // Crowd moderation fields
    private int confirmations = 1; // Number of people who confirmed this menu
    private String verificationStatus = "UNVERIFIED"; // UNVERIFIED, VERIFIED, UNCERTAIN

    public MealUpdate() {}

    public MealUpdate(String id, String mealType, String date, List<String> items, Instant postedAt, int confirmations, String verificationStatus) {
        this.id = id;
        this.mealType = mealType;
        this.date = date;
        this.items = items;
        this.postedAt = postedAt;
        this.confirmations = confirmations;
        this.verificationStatus = verificationStatus;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public List<String> getItems() { return items; }
    public void setItems(List<String> items) { this.items = items; }

    public Instant getPostedAt() { return postedAt; }
    public void setPostedAt(Instant postedAt) { this.postedAt = postedAt; }

    public int getConfirmations() { return confirmations; }
    public void setConfirmations(int confirmations) { this.confirmations = confirmations; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    @Override
    public String toString() {
        return "MealUpdate{" +
                "id='" + id + '\'' +
                ", mealType='" + mealType + '\'' +
                ", date='" + date + '\'' +
                ", items=" + items +
                ", postedAt=" + postedAt +
                ", confirmations=" + confirmations +
                ", verificationStatus='" + verificationStatus + '\'' +
                '}';
    }
}
