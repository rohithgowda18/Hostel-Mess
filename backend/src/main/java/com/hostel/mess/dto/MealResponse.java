package com.hostel.mess.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MealResponse {

    private String mealType;

    private String date;

    private List<String> items;

    private String postedAt;

    // Crowd moderation fields
    private int confirmations;

    private String verificationStatus; // UNVERIFIED, VERIFIED, UNCERTAIN

    // Time window info
    private boolean updateWindowOpen;

    private String updateWindowMessage;
}
