package com.hostel.mess.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Mutual friendship relationship model.
 * Status can be: PENDING, ACCEPTED, REJECTED
 */
@Document(collection = "friendships")
@CompoundIndexes({
    @CompoundIndex(name = "requester_receiver_idx", def = "{'requesterId': 1, 'receiverId': 1}"),
    @CompoundIndex(name = "receiver_status_idx", def = "{'receiverId': 1, 'status': 1}")
})
public class Friendship {

    @Id
    private String id;

    @Indexed
    private String requesterId;

    private String requesterEmail;

    @Indexed
    private String receiverId;

    private String receiverEmail;

    private String status; // PENDING, ACCEPTED, REJECTED

    private Instant createdAt;

    private Instant updatedAt;

    public Friendship() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public Friendship(String requesterId, String requesterEmail, String receiverId, String receiverEmail, String status) {
        this();
        this.requesterId = requesterId;
        this.requesterEmail = requesterEmail;
        this.receiverId = receiverId;
        this.receiverEmail = receiverEmail;
        this.status = status;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRequesterId() {
        return requesterId;
    }

    public void setRequesterId(String requesterId) {
        this.requesterId = requesterId;
    }

    public String getRequesterEmail() {
        return requesterEmail;
    }

    public void setRequesterEmail(String requesterEmail) {
        this.requesterEmail = requesterEmail;
    }

    public String getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(String receiverId) {
        this.receiverId = receiverId;
    }

    public String getReceiverEmail() {
        return receiverEmail;
    }

    public void setReceiverEmail(String receiverEmail) {
        this.receiverEmail = receiverEmail;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
