package com.hostel.mess.model;

import java.time.Instant;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "meal_updates")
@CompoundIndex(name = "meal_date_idx", def = "{'mealType': 1, 'date': 1}", unique = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MealUpdate {

    @Id
    private String id;

    private String mealType; // BREAKFAST, LUNCH, SNACKS, DINNER

    private String date; // Format: YYYY-MM-DD

    private List<String> items;

    private Instant postedAt;

    // Crowd moderation fields
    private int confirmations = 1; // Number of people who confirmed this menu

    private String verificationStatus = "UNVERIFIED"; // UNVERIFIED, VERIFIED, UNCERTAIN
}
