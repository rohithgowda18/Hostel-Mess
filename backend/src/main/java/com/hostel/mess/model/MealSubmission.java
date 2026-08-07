package com.hostel.mess.model;

import java.time.Instant;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "meal_submissions")
public class MealSubmission {
    @Id
    private String id;
    private String studentId;
    private String studentEmail;
    private String mealType; // BREAKFAST, LUNCH, SNACKS, DINNER
    private String date; // YYYY-MM-DD
    private List<String> selectedItems;
    private String photoUrl;
    private Instant submittedAt;

    public MealSubmission() {}

    public MealSubmission(String studentId, String studentEmail, String mealType, String date, List<String> selectedItems, String photoUrl) {
        this.studentId = studentId;
        this.studentEmail = studentEmail;
        this.mealType = mealType;
        this.date = date;
        this.selectedItems = selectedItems;
        this.photoUrl = photoUrl;
        this.submittedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public List<String> getSelectedItems() { return selectedItems; }
    public void setSelectedItems(List<String> selectedItems) { this.selectedItems = selectedItems; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
}
