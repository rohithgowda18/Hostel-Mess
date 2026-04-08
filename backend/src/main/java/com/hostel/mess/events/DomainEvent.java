package com.hostel.mess.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;
import java.time.Instant;

/**
 * Base class for all domain events in the application
 */
@Getter
public abstract class DomainEvent extends ApplicationEvent {
    private final String eventId;
    private final String userId;
    private final Instant eventTimestamp;

    public DomainEvent(Object source, String eventId, String userId) {
        super(source);
        this.eventId = eventId;
        this.userId = userId;
        this.eventTimestamp = Instant.now();
    }

    /**
     * Get the type of the event for serialization/logging purposes
     * @return Event type string
     */
    public abstract String getEventType();
}
