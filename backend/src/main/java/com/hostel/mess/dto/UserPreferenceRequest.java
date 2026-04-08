package com.hostel.mess.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * User preference request for roommate matching
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferenceRequest {
    private String sleepTime;
    private String studyTime;
    private String cleanliness;
    private String noiseTolerance;
    private String acPreference;
    private String guestFrequency;
    private String gamingHabit;
    private Boolean smoker;
}
