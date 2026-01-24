package com.hostel.mess.service;

import com.hostel.mess.dto.BreakfastRequest;
import com.hostel.mess.dto.BreakfastResponse;
import com.hostel.mess.model.BreakfastUpdate;
import com.hostel.mess.repository.BreakfastRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class BreakfastService {

    @Autowired
    private BreakfastRepository breakfastRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Get today's breakfast
     */
    public BreakfastResponse getTodayBreakfast() {
        String today = LocalDate.now().format(DATE_FORMATTER);
        Optional<BreakfastUpdate> breakfastOpt = breakfastRepository.findByDate(today);

        if (breakfastOpt.isEmpty()) {
            return null;
        }

        BreakfastUpdate breakfast = breakfastOpt.get();
        return new BreakfastResponse(
                breakfast.getDate(),
                breakfast.getItems(),
                breakfast.getPostedAt().toString()
        );
    }

    /**
     * Update or create today's breakfast
     */
    public BreakfastResponse updateBreakfast(BreakfastRequest request) {
        // Check if an entry for this date already exists
        Optional<BreakfastUpdate> existingOpt = breakfastRepository.findByDate(request.getDate());

        BreakfastUpdate breakfast;
        if (existingOpt.isPresent()) {
            // Update existing entry
            breakfast = existingOpt.get();
            breakfast.setItems(request.getItems());
            breakfast.setPostedAt(Instant.now());
        } else {
            // Create new entry
            breakfast = new BreakfastUpdate();
            breakfast.setDate(request.getDate());
            breakfast.setItems(request.getItems());
            breakfast.setPostedAt(Instant.now());
        }

        BreakfastUpdate saved = breakfastRepository.save(breakfast);

        return new BreakfastResponse(
                saved.getDate(),
                saved.getItems(),
                saved.getPostedAt().toString()
        );
    }
}
