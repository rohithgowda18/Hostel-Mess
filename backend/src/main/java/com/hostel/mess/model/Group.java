package com.hostel.mess.model;

import java.time.Instant;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "groups")
@CompoundIndex(name = "members_created_idx", def = "{'members': 1, 'createdAt': -1}")
public class Group {
    @Id
    private String id;
    
    @Indexed
    private String name;
    
    @Indexed(unique = true)
    private String groupCode; // Unique 8-character code to join group (shareable via WhatsApp)
    
    @Indexed
    private List<String> members; // List of user emails
    
    @Indexed
    private String creator; // Creator email
    
    @Indexed
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
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
