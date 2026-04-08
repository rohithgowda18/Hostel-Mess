package com.hostel.mess.events;

import com.hostel.mess.dto.MealResponse;
import lombok.Getter;
import java.util.UUID;

/**
 * Event published when a meal update is created, updated, or deleted
 */
@Getter
public class MealUpdatedEvent extends DomainEvent {
    private final String mealId;
    private final String mealType;
    private final MealResponse mealData;
    private final String actionType; // CREATE, UPDATE, DELETE

    public MealUpdatedEvent(Object source, String mealId, String mealType, MealResponse mealData, String actionType, String userId) {
        super(source, UUID.randomUUID().toString(), userId);
        this.mealId = mealId;
        this.mealType = mealType;
        this.mealData = mealData;
        this.actionType = actionType;
    }

    @Override
    public String getEventType() {
        return "MEAL_UPDATED";
    }
}
