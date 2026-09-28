package com.hostel.mess.model;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * MongoDB document storing metadata for meal evidence and official photos.
 * The actual binary image stream is stored in MongoDB GridFS.
 */
@Document(collection = "meal_photos")
public class MealPhoto {

    @Id
    private String id;
    private String mealServiceId;
    private String mealType;
    private String date;
    private String uploadedBy; // e.g. "Rohith Gowda" or "Mess Admin"
    private String userEmail;
    private String type = "COMMUNITY"; // OFFICIAL, COMMUNITY
    private String gridFsFileId;
    private List<String> imageUrls = new ArrayList<>();
    private String caption;
    private String description;
    private String visibility = "VISIBLE"; // VISIBLE, PENDING_REVIEW, HIDDEN
    private String moderationStatus = "APPROVED"; // APPROVED, FLAGGED
    private Date uploadedAt = new Date();

    public MealPhoto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMealServiceId() { return mealServiceId; }
    public void setMealServiceId(String mealServiceId) { this.mealServiceId = mealServiceId; }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getGridFsFileId() { return gridFsFileId; }
    public void setGridFsFileId(String gridFsFileId) { this.gridFsFileId = gridFsFileId; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }

    public String getCaption() { return caption != null ? caption : description; }
    public void setCaption(String caption) { this.caption = caption; this.description = caption; }

    public String getDescription() { return description != null ? description : caption; }
    public void setDescription(String description) { this.description = description; this.caption = description; }

    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }

    public String getModerationStatus() { return moderationStatus; }
    public void setModerationStatus(String moderationStatus) { this.moderationStatus = moderationStatus; }

    public Date getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Date uploadedAt) { this.uploadedAt = uploadedAt; }
}
