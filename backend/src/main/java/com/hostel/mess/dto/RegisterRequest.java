package com.hostel.mess.dto;

/**
 * Request DTO for user registration
 */
public class RegisterRequest {
    private String email;
    private String password;
    private String hostel;
    private String roomNumber;
    private String year;
    private String branch;
    
    // Constructors
    public RegisterRequest() {}

    public RegisterRequest(String email, String password, String hostel, String roomNumber, String year, String branch) {
        this.email = email;
        this.password = password;
        this.hostel = hostel;
        this.roomNumber = roomNumber;
        this.year = year;
        this.branch = branch;
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
}
