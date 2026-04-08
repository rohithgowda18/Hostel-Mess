package com.hostel.mess.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LostItemRequest {
    private String type; // LOST, FOUND
    private String title;
    private String description;
    private String location;
    private String contact;
}
