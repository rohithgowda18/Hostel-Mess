package com.hostel.mess.model;

import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "student_food_photos")
public class StudentFoodPhoto {
    @Id
    private String id;
    private String mealType;
    private String date;
    private List<String> imageUrls;
    private String description;
    private Date uploadedAt;

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Date getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Date uploadedAt) { this.uploadedAt = uploadedAt; }
}
