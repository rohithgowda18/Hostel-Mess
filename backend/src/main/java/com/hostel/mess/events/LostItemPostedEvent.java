package com.hostel.mess.events;

import lombok.Getter;
import java.time.Instant;
import java.util.UUID;

/**
 * Event published when a lost/found item is posted
 */
@Getter
public class LostItemPostedEvent extends DomainEvent {
    private String itemId;
    private String type; // LOST, FOUND
    private String title;
    private String postedBy;
    private String postedByName;
    private String location;
    private Instant createdAt;

    public LostItemPostedEvent(Object source, String itemId, String type, String title, String postedBy, String postedByName, String location) {
        super(source, UUID.randomUUID().toString(), postedBy);
        this.itemId = itemId;
        this.type = type;
        this.title = title;
        this.postedBy = postedBy;
        this.postedByName = postedByName;
        this.location = location;
        this.createdAt = Instant.now();
    }

    @Override
    public String getEventType() {
        return "LOST_ITEM_POSTED";
    }
}
