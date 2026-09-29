package com.hostel.mess.model;

import java.time.Instant;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "groups")
public class Group {
    @Id
    private String id;
    
    private String name;
    private String groupCode; // Unique 8-character code to join group (shareable via WhatsApp)
    private List<String> members; // List of user emails
    private String creator; // Creator email
    private String creatorId; // Creator user id
    private Instant createdAt;
    
    // Constructors
    public Group() {
        this.createdAt = Instant.now();
    }
    
    public Group(String name, String groupCode, List<String> members, String creator) {
        this();
        this.name = name;
        this.groupCode = groupCode;
        this.members = members;
        this.creator = creator;
    }

    public Group(String name, String groupCode, List<String> members, String creator, String creatorId) {
        this(name, groupCode, members, creator);
        this.creatorId = creatorId;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getGroupCode() {
        return groupCode;
    }
    
    public void setGroupCode(String groupCode) {
        this.groupCode = groupCode;
    }
    
    public List<String> getMembers() {
        return members;
    }
    
    public void setMembers(List<String> members) {
        this.members = members;
    }
    
    public String getCreator() {
        return creator;
    }
    
    public void setCreator(String creator) {
        this.creator = creator;
    }

    public String getCreatedBy() {
        return creator;
    }

    public void setCreatedBy(String createdBy) {
        this.creator = createdBy;
    }

    public String getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(String creatorId) {
        this.creatorId = creatorId;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    /**
     * Checks if given user ID or email is the owner/creator of this group.
     */
    public boolean isOwner(String userId, String userEmail) {
        if (userId != null && userId.equals(this.creatorId)) {
            return true;
        }
        if (userEmail != null && userEmail.equalsIgnoreCase(this.creator)) {
            return true;
        }
        if (userId != null && userId.equalsIgnoreCase(this.creator)) {
            return true;
        }
        return false;
    }
}
