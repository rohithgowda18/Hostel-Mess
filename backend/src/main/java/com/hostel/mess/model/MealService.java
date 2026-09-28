package com.hostel.mess.model;

import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Authoritative central domain concept representing a discrete meal serving window.
 * All modules (Menus, RSVP, Attendance, Photos, Feedback, Complaints, Waste) reference this entity.
 */
@Document(collection = "meal_services")
@CompoundIndex(name = "date_mealType_idx", def = "{'date': 1, 'mealType': 1}", unique = true)
public class MealService {

    @Id
    private String id;
    private String date; // e.g., "2026-09-28"
    private String mealType; // BREAKFAST, LUNCH, SNACKS, DINNER
    private String startTime; // e.g., "12:30"
    private String endTime; // e.g., "14:30"
    private String status; // SCHEDULED, PREPARING, OPEN, CLOSED, COMPLETED, CANCELLED
    private Integer expectedAttendance = 0;
    private Integer actualAttendance = 0;
    private Double wasteWeightKg = 0.0;
    private List<String> plannedMenu = new ArrayList<>();
    private String chefSpecial;
    private Long createdAt = System.currentTimeMillis();
    private Long updatedAt = System.currentTimeMillis();

    public MealService() {}

    public MealService(String date, String mealType, String startTime, String endTime, String status) {
        this.date = date;
        this.mealType = mealType;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getExpectedAttendance() { return expectedAttendance; }
    public void setExpectedAttendance(Integer expectedAttendance) { this.expectedAttendance = expectedAttendance; }

    public Integer getActualAttendance() { return actualAttendance; }
    public void setActualAttendance(Integer actualAttendance) { this.actualAttendance = actualAttendance; }

    public Double getWasteWeightKg() { return wasteWeightKg != null ? wasteWeightKg : 0.0; }
    public void setWasteWeightKg(Double wasteWeightKg) { this.wasteWeightKg = wasteWeightKg; }

    public List<String> getPlannedMenu() { return plannedMenu; }
    public void setPlannedMenu(List<String> plannedMenu) { this.plannedMenu = plannedMenu; }

    public String getChefSpecial() { return chefSpecial; }
    public void setChefSpecial(String chefSpecial) { this.chefSpecial = chefSpecial; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }

    public Long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Long updatedAt) { this.updatedAt = updatedAt; }
}
