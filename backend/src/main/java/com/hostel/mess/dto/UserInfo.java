package com.hostel.mess.dto;

/**
 * User info in response (without password)
 */
public class UserInfo {
    private String id;
    private String name;
    private String email;
    private String hostel;
    
    // Constructors
    public UserInfo() {}
    
    public UserInfo(String id, String name, String email, String hostel) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.hostel = hostel;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
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
}
