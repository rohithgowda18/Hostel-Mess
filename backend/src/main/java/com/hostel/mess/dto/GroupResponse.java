package com.hostel.mess.dto;

import java.time.Instant;
import java.util.List;

public class GroupResponse {
    private String id;
    private String name;
    private String groupCode; // 8-character code for sharing via WhatsApp
    private List<String> members;
    private String creator; // Creator email
    private String creatorId; // Creator user id
    private Integer memberCount;
    private Instant createdAt;
    
    // Constructor
    public GroupResponse() {}
    
    public GroupResponse(String id, String name, String groupCode, List<String> members, String creator, String creatorId, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.groupCode = groupCode;
        this.members = members;
        this.creator = creator;
        this.creatorId = creatorId;
        this.memberCount = members != null ? members.size() : 0;
        this.createdAt = createdAt;
    }

    public GroupResponse(com.hostel.mess.model.Group group) {
        if (group != null) {
            this.id = group.getId();
            this.name = group.getName();
            this.groupCode = group.getGroupCode();
            this.members = group.getMembers();
            this.creator = group.getCreator();
            this.creatorId = group.getCreatorId();
            this.memberCount = group.getMembers() != null ? group.getMembers().size() : 0;
            this.createdAt = group.getCreatedAt();
        }
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

    public String getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(String creatorId) {
        this.creatorId = creatorId;
    }
    
    public Integer getMemberCount() {
        return memberCount;
    }
    
    public void setMemberCount(Integer memberCount) {
        this.memberCount = memberCount;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
