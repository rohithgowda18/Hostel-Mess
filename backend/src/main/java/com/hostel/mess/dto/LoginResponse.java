package com.hostel.mess.dto;

/**
 * Response DTO for login
 */
public class LoginResponse {
    private String token;
    private String type = "Bearer";
    private UserInfo user;
    
    // Constructors
    public LoginResponse() {}
    
    public LoginResponse(String token, UserInfo user) {
        this.token = token;
        this.user = user;
        this.type = "Bearer";
    }
    
    // Getters and Setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public UserInfo getUser() {
        return user;
    }
    
    public void setUser(UserInfo user) {
        this.user = user;
    }
}
