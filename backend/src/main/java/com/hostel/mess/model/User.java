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
    
    @Indexed(unique = true)
    private String email;

    private String password; // BCrypt hashed

    private String hostel;

    private String roomNumber;

    private String year;

    private String branch;

    private String role = "STUDENT"; // Default role

    private Instant createdAt;

    private Instant updatedAt;
    
    // Constructors
    public User() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.role = "STUDENT";
    }

    public User(String email, String password, String hostel, String roomNumber, String year, String branch) {
        this.email = email;
        this.password = password;
        this.hostel = hostel;
        this.roomNumber = roomNumber;
        this.year = year;
        this.branch = branch;
        this.role = "STUDENT";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }
    // Username removed

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
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    // Name removed
    
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
