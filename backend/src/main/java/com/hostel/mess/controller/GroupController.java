package com.hostel.mess.controller;

import com.hostel.mess.dto.GroupResponse;
import com.hostel.mess.model.Group;
import com.hostel.mess.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "https://rohithgowda18.github.io", "https://hostel-mess-one.vercel.app"})
public class GroupController {
    
    @Autowired
    private GroupService groupService;
    
    /**
     * Get authenticated user ID - Disabled (no auth required)
     */
    private String getAuthenticatedUserId() {
        return "default-user";
    }
    
    /**
     * POST /api/groups/create
     * Create a new group (requires authentication)
     * Body: { "name": "Night Owls" }
     */
    @PostMapping("/create")
    public ResponseEntity<?> createGroup(@RequestBody Map<String, String> payload) {
        try {
            String userId = getAuthenticatedUserId();
            String name = payload.get("name");
            
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Group name is required"));
            }
            
            Group group = groupService.createGroup(name, userId);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(convertToResponse(group));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * POST /api/groups/join
     * Join a group using 8-character group code (requires authentication)
     * Body: { "groupCode": "ABC12345" }
     */
    @PostMapping("/join")
    public ResponseEntity<?> joinGroup(@RequestBody Map<String, String> payload) {
        try {
            String userId = getAuthenticatedUserId();
            String groupCode = payload.get("groupCode");
            
            if (groupCode == null || groupCode.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Group code is required"));
            }
            
            Group group = groupService.joinGroup(groupCode, userId);
            return ResponseEntity.ok(convertToResponse(group));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * GET /api/groups/my-groups
     * Get all groups for authenticated user (requires authentication)
     */
    @GetMapping("/my-groups")
    public ResponseEntity<?> getUserGroups() {
        try {
            String userId = getAuthenticatedUserId();
            List<Group> groups = groupService.getUserGroups(userId);
            List<GroupResponse> responses = groups.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
            return ResponseEntity.ok(responses);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * GET /api/groups/{groupId}
     * Get group details
     */
    @GetMapping("/{groupId}")
    public ResponseEntity<?> getGroupDetails(@PathVariable String groupId) {
        try {
            Group group = groupService.getGroupDetails(groupId);
            return ResponseEntity.ok(convertToResponse(group));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    // Helper method to convert Group to GroupResponse
    private GroupResponse convertToResponse(Group group) {
        return new GroupResponse(
            group.getId(),
            group.getName(),
            group.getGroupCode(),
            group.getMembers(),
            group.getCreatedAt()
        );
    }
}
