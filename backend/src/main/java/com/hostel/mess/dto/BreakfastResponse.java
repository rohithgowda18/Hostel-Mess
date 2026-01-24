package com.hostel.mess.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BreakfastResponse {

    private String date;

    private List<String> items;

    private String postedAt;
}
