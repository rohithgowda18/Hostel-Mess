package com.hostel.mess.dto;

import java.util.List;
import java.util.ArrayList;

public class UserInfo {
    private String id;
    private String email;
    private String hostel;
    private String roomNumber;
    private String year;
    private String branch;
    private String role;
    
    private Integer floor;
    private Boolean directoryVisible;
    private String phoneNumber;
    private String profilePhoto;
    private List<String> favoriteFoods = new ArrayList<>();
    
    // Constructors
    public UserInfo() {}

    public UserInfo(String id, String email, String hostel, String roomNumber, String year, String branch, String role,
                    Integer floor, Boolean directoryVisible, String phoneNumber, String profilePhoto, List<String> favoriteFoods) {
        this.id = id;
        this.email = email;
        this.hostel = hostel;
        this.roomNumber = roomNumber;
        this.year = year;
        this.branch = branch;
        this.role = role;
        this.floor = floor;
        this.directoryVisible = directoryVisible;
        this.phoneNumber = phoneNumber;
        this.profilePhoto = profilePhoto;
        this.favoriteFoods = favoriteFoods;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getHostel() { return hostel; }
    public void setHostel(String hostel) { this.hostel = hostel; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }

    public Boolean getDirectoryVisible() { return directoryVisible != null ? directoryVisible : true; }
    public void setDirectoryVisible(Boolean directoryVisible) { this.directoryVisible = directoryVisible; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getProfilePhoto() { return profilePhoto; }
    public void setProfilePhoto(String profilePhoto) { this.profilePhoto = profilePhoto; }

    public List<String> getFavoriteFoods() { return favoriteFoods != null ? favoriteFoods : new ArrayList<>(); }
    public void setFavoriteFoods(List<String> favoriteFoods) { this.favoriteFoods = favoriteFoods; }
}
