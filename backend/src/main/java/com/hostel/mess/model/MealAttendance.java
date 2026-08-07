package com.hostel.mess.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "meal_attendance")
@CompoundIndex(name = "user_meal_attend_idx", def = "{'userEmail': 1, 'mealType': 1, 'date': 1}", unique = true)
public class MealAttendance {
    @Id
    private String id;
    private String userEmail;
    private String mealType; // BREAKFAST, LUNCH, SNACKS, DINNER
    private String date; // YYYY-MM-DD
    
    private Boolean expected; // true = YES, false = NO, null = Unmarked
    private Boolean present; // true = Present, false = Absent/Not checked in yet
    private Instant checkedInAt;

    public MealAttendance() {
        this.present = false;
    }

    public MealAttendance(String userEmail, String mealType, String date, Boolean expected) {
        this();
        this.userEmail = userEmail;
        this.mealType = mealType;
        this.date = date;
        this.expected = expected;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public Boolean getExpected() { return expected; }
    public void setExpected(Boolean expected) { this.expected = expected; }

    public Boolean getPresent() { return present; }
    public void setPresent(Boolean present) { this.present = present; }

    public Instant getCheckedInAt() { return checkedInAt; }
    public void setCheckedInAt(Instant checkedInAt) { this.checkedInAt = checkedInAt; }
}
