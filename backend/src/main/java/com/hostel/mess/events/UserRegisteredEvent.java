package com.hostel.mess.events;

import com.hostel.mess.model.User;
import lombok.Getter;
import java.util.UUID;

/**
 * Event published when a new user registers
 */
@Getter
public class UserRegisteredEvent extends DomainEvent {
    private final User user;

    public UserRegisteredEvent(Object source, User user) {
        super(source, UUID.randomUUID().toString(), user != null ? user.getId() : "UNKNOWN");
        this.user = user;
    }

    @Override
    public String getEventType() {
        return "USER_REGISTERED";
    }
}
