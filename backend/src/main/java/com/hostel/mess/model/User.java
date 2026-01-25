package com.hostel.mess.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.Instant;

/**
 * User model for authentication and group coordination
 */
@Document(collection = "users")
public class User {
    
    @Id
    private String id;
    
    private String name;
    
    @Indexed(unique = true)
    private String email;
    
    private String password; // BCrypt hashed
    
    private String hostel;
    
    private String role = "STUDENT"; // Default role
    
    private Instant createdAt;
    
    private Instant updatedAt;
    
    // Constructors
    public User() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.role = "STUDENT";
    }
    
    public User(String name, String email, String password, String hostel) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.hostel = hostel;
        this.role = "STUDENT";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
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
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getHostel() {
        return hostel;
    }
    
    public void setHostel(String hostel) {
        this.hostel = hostel;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
    
    public Instant getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
