package com.hostel.mess.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.hostel.mess.dto.GroupResponse;
import com.hostel.mess.dto.ChatRequest;
import com.hostel.mess.dto.ChatResponse;
import com.hostel.mess.model.Group;
import com.hostel.mess.model.ChatMessage;
import com.hostel.mess.service.GroupService;
import com.hostel.mess.security.JwtTokenProvider;

import jakarta.validation.Valid;

@RestController
public class GroupController {
    
    @Autowired
    private GroupService groupService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String extractUserIdFromRequest(String authorizationHeader) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String token = authorizationHeader.substring(7);
            if (jwtTokenProvider.validateToken(token)) {
                return jwtTokenProvider.getUserIdFromToken(token);
            }
        }
        return null;
    }
    
    @PostMapping("/api/groups/create")
    public ResponseEntity<?> createGroup(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> payload) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
            }
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
    
    @PostMapping("/api/groups/join")
    public ResponseEntity<?> joinGroup(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> payload) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
            }
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
    
    @GetMapping("/api/groups/my-groups")
    public ResponseEntity<?> getUserGroups(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
            }
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
    
    @GetMapping("/api/groups/{groupId}")
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
    
    @DeleteMapping("/api/groups/{groupId}/leave")
    public ResponseEntity<?> leaveGroup(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String groupId) {
        try {
            String userId = userDetails != null ? userDetails.getUsername() : null;
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
            }
            Group group = groupService.leaveGroup(groupId, userId);
            if (group == null) {
                return ResponseEntity.ok(Map.of("message", "Left group successfully. Group deleted as it has no members."));
            }
            return ResponseEntity.ok(convertToResponse(group));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // Chat endpoints mapped inside GroupController
    @PostMapping("/api/chat/send")
    public ResponseEntity<?> sendMessage(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody ChatRequest request) {
        try {
            String userId = extractUserIdFromRequest(authHeader);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            ChatMessage chatMessage = groupService.sendMessage(
                request.getChatId(),
                userId,
                request.getMessage()
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ChatResponse(chatMessage));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to send message: " + e.getMessage()));
        }
    }

    @GetMapping("/api/chat/messages")
    public ResponseEntity<?> getMessages(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam String chatId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            String userId = extractUserIdFromRequest(authHeader);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            var pageResult = groupService.getMessagesPaged(chatId, page, size);
            List<ChatResponse> responses = pageResult.getContent().stream()
                .map(ChatResponse::new)
                .toList();

            return ResponseEntity.ok(Map.of(
                "messages", responses,
                "page", pageResult.getNumber(),
                "size", pageResult.getSize(),
                "totalPages", pageResult.getTotalPages(),
                "totalElements", pageResult.getTotalElements()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to retrieve messages: " + e.getMessage()));
        }
    }

    @DeleteMapping("/api/chat/{messageId}")
    public ResponseEntity<?> deleteMessage(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String messageId) {
        try {
            String userId = extractUserIdFromRequest(authHeader);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            groupService.deleteMessage(messageId, userId);
            return ResponseEntity.ok(Map.of(
                "message", "Message deleted successfully",
                "messageId", messageId
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to delete message: " + e.getMessage()));
        }
    }

    private GroupResponse convertToResponse(Group group) {
        return new GroupResponse(
            group.getId(),
            group.getName(),
            group.getGroupCode(),
            group.getMembers(),
            group.getCreator(),
            group.getCreatedAt()
        );
    }
}
