package com.hostel.mess.events;

import lombok.Getter;
import java.time.Instant;
import java.util.UUID;

/**
 * Event published when a roommate request is sent
 */
@Getter
public class RoommateRequestSentEvent extends DomainEvent {
    private String requestId;
    private String fromUserId;
    private String fromUserName;
    private String toUserId;
    private String toUserName;
    private Instant createdAt;

    public RoommateRequestSentEvent(Object source, String requestId, String fromUserId, String fromUserName, String toUserId, String toUserName) {
        super(source, UUID.randomUUID().toString(), fromUserId);
        this.requestId = requestId;
        this.fromUserId = fromUserId;
        this.fromUserName = fromUserName;
        this.toUserId = toUserId;
        this.toUserName = toUserName;
        this.createdAt = Instant.now();
    }

    @Override
    public String getEventType() {
        return "ROOMMATE_REQUEST_SENT";
    }
}
