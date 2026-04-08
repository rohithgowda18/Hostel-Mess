package com.hostel.mess.service;

import com.hostel.mess.dto.BreakfastRequest;
import com.hostel.mess.dto.BreakfastResponse;
import com.hostel.mess.events.BreakfastUpdatedEvent;
import com.hostel.mess.model.BreakfastUpdate;
import com.hostel.mess.repository.BreakfastRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class BreakfastService {

    @Autowired
    private BreakfastRepository breakfastRepository;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

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
    @Transactional
    public BreakfastResponse updateBreakfast(BreakfastRequest request) {
        // Check if an entry for this date already exists
        Optional<BreakfastUpdate> existingOpt = breakfastRepository.findByDate(request.getDate());

        BreakfastUpdate breakfast;
        String actionType = "CREATE";
        if (existingOpt.isPresent()) {
            // Update existing entry
            actionType = "UPDATE";
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

        BreakfastResponse response = new BreakfastResponse(
                saved.getDate(),
                saved.getItems(),
                saved.getPostedAt().toString()
        );

        // Publish event asynchronously (after transaction commits)
        // Using "GLOBAL" as groupId for hostel-wide breakfast
        eventPublisher.publishEvent(new BreakfastUpdatedEvent(
            this,                  // source
            saved.getId(),         // breakfastId
            "GLOBAL",              // groupId
            response,              // payload
            actionType,            // CREATE or UPDATE
            "SYSTEM"               // userId - system generated
        ));

        return response;
    }
}
