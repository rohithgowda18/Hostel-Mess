package com.hostel.mess.dto;

/**
 * User info in response (without password)
 */
public class UserInfo {
    private String id;
    private String email;
    private String hostel;
    private String roomNumber;
    private String year;
    private String branch;
    private String role;
    
    // Constructors
    public UserInfo() {}

    public UserInfo(String id, String email, String hostel, String roomNumber, String year, String branch, String role) {
        this.id = id;
        this.email = email;
        this.hostel = hostel;
        this.roomNumber = roomNumber;
        this.year = year;
        this.branch = branch;
        this.role = role;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getHostel() {
        return hostel;
    }

    public void setHostel(String hostel) {
        this.hostel = hostel;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    @Override
    public String toString() {
        return "UserInfo{" +
                "id='" + id + '\'' +
                ", email='" + email + '\'' +
                ", hostel='" + hostel + '\'' +
                ", roomNumber='" + roomNumber + '\'' +
                ", year='" + year + '\'' +
                ", branch='" + branch + '\'' +
                ", role='" + role + '\'' +
                '}';
    }
}
