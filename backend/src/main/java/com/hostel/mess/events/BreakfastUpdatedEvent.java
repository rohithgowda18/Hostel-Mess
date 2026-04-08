package com.hostel.mess.events;

import com.hostel.mess.dto.BreakfastResponse;
import lombok.Getter;
import java.util.UUID;

/**
 * Event published when a breakfast update is created or updated
 */
@Getter
public class BreakfastUpdatedEvent extends DomainEvent {
    private final String breakfastId;
    private final String groupId;
    private final BreakfastResponse payload;
    private final String actionType; // CREATE, UPDATE

    public BreakfastUpdatedEvent(Object source, String breakfastId, String groupId, BreakfastResponse payload, String actionType, String userId) {
        super(source, UUID.randomUUID().toString(), userId);
        this.breakfastId = breakfastId;
        this.groupId = groupId;
        this.payload = payload;
        this.actionType = actionType;
    }

    @Override
    public String getEventType() {
        return "BREAKFAST_UPDATED";
    }
}
