package com.hostel.mess.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "breakfast_updates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BreakfastUpdate {

    @Id
    private String id;

    private String date; // Format: YYYY-MM-DD

    private List<String> items;

    private Instant postedAt;
}
