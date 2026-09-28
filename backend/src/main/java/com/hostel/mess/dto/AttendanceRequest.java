package com.hostel.mess.dto;

public class AttendanceRequest {
    private String mealType;
    private String date;
    private Boolean willEat;
    private String token;

    public AttendanceRequest() {}

    public AttendanceRequest(String mealType, String date, Boolean willEat) {
        this.mealType = mealType;
        this.date = date;
        this.willEat = willEat;
    }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public Boolean getWillEat() { return willEat; }
    public void setWillEat(Boolean willEat) { this.willEat = willEat; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
