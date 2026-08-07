package com.hostel.mess.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "food_ratings")
@CompoundIndex(name = "user_meal_rating_idx", def = "{'userEmail': 1, 'mealType': 1, 'date': 1}", unique = true)
public class FoodRating {
    @Id
    private String id;
    private String mealType;
    private String date; // YYYY-MM-DD
    private String userId;
    private String userEmail;
    
    private int ratingOverall; // 1-5
    private int taste; // 1-5
    private int quality; // 1-5
    private int quantity; // 1-5
    private int temperature; // 1-5
    private int cleanliness; // 1-5
    private int presentation; // 1-5
    
    private String reviewText;
    private Instant createdAt;

    public FoodRating() {
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public int getRatingOverall() { return ratingOverall; }
    public void setRatingOverall(int ratingOverall) { this.ratingOverall = ratingOverall; }

    public int getTaste() { return taste; }
    public void setTaste(int taste) { this.taste = taste; }

    public int getQuality() { return quality; }
    public void setQuality(int quality) { this.quality = quality; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public int getTemperature() { return temperature; }
    public void setTemperature(int temperature) { this.temperature = temperature; }

    public int getCleanliness() { return cleanliness; }
    public void setCleanliness(int cleanliness) { this.cleanliness = cleanliness; }

    public int getPresentation() { return presentation; }
    public void setPresentation(int presentation) { this.presentation = presentation; }

    public String getReviewText() { return reviewText; }
    public void setReviewText(String reviewText) { this.reviewText = reviewText; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
