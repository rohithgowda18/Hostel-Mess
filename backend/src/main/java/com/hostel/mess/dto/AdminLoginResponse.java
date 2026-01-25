package com.hostel.mess.dto;

import java.time.Instant;

public class AdminLoginResponse {
    private String id;
    private String username;
    private String fullName;
    private String role;
    private String token;
    private Instant loginTime;
    
    public AdminLoginResponse() {}
    
    public AdminLoginResponse(String id, String username, String fullName, String role, String token) {
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.role = role;
        this.token = token;
        this.loginTime = Instant.now();
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getFullName() {
        return fullName;
    }
    
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public Instant getLoginTime() {
        return loginTime;
    }
    
    public void setLoginTime(Instant loginTime) {
        this.loginTime = loginTime;
    }
}
