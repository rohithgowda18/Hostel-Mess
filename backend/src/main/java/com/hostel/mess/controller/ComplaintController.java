package com.hostel.mess.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hostel.mess.dto.ComplaintRequest;
import com.hostel.mess.dto.ComplaintResponse;
import com.hostel.mess.dto.PaginatedResponse;
import com.hostel.mess.service.ComplaintService;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {
    
    @Autowired
    private ComplaintService complaintService;
    
    /**
     * Raise a new complaint against a food item
     * POST /api/complaints
     */
    @PostMapping
    public ResponseEntity<?> raiseComplaint(@RequestBody ComplaintRequest request) {
        try {
            // Validation
            if (request.getMealType() == null || request.getMealType().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Meal type is required"));
            }
            
            if (request.getFoodItem() == null || request.getFoodItem().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Food item is required"));
            }
            
            ComplaintResponse response = complaintService.raiseComplaint(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error raising complaint: " + e.getMessage()));
        }
    }
    
    /**
     * Get paginated complaints for a specific meal type today
     * GET /api/complaints/today/{mealType}?page=0&size=20
     */
    @GetMapping("/today/{mealType}")
    public ResponseEntity<?> getComplaintsToday(
        @PathVariable String mealType,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size
    ) {
        try {
            // Validate pagination parameters
            if (page < 0) page = 0;
            if (size < 1) size = 20;
            if (size > 100) size = 100; // Max 100 items per page
            
            var pageResult = complaintService.getComplaintsByMealTypePaged(mealType, page, size);
            List<ComplaintResponse> responses = pageResult.getContent().stream()
                .map(complaint -> new ComplaintResponse(
                    complaint.getId(),
                    complaint.getMealType(),
                    complaint.getFoodItem(),
                    complaint.getDate(),
                    complaint.getReasons(),
                    complaint.getComments(),
                    complaint.getComplaintCount(),
                    complaint.getAgreeVotes(),
                    complaint.getDisagreeVotes(),
                    complaint.getStatus()
                ))
                .toList();
            
            PaginatedResponse<ComplaintResponse> response = new PaginatedResponse<>(
                responses,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalPages(),
                pageResult.getTotalElements()
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error fetching complaints: " + e.getMessage()));
        }
    }
    
    /**
     * Vote on a complaint (AGREE or DISAGREE)
     * POST /api/complaints/vote
        * Body: { "complaintId": "abc123", "vote": "AGREE" }
     */
    @PostMapping("/vote")
    public ResponseEntity<?> voteOnComplaint(
        @RequestBody Map<String, String> payload,
        @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String complaintId = payload.get("complaintId");
            String vote = payload.get("vote");
            String userId = userDetails != null ? userDetails.getUsername() : null;
            
            // Validation
            if (complaintId == null || complaintId.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Complaint ID is required"));
            }
            
            if (vote == null || (!vote.equalsIgnoreCase("AGREE") && !vote.equalsIgnoreCase("DISAGREE"))) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Vote must be AGREE or DISAGREE"));
            }
            
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Authentication required"));
            }
            
            ComplaintResponse response = complaintService.voteOnComplaint(complaintId, vote, userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error voting on complaint: " + e.getMessage()));
        }
    }
    
    /**
     * Get paginated all complaints (admin only)
     * GET /api/complaints/admin/all?page=0&size=20
     */
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllComplaints(
        @RequestHeader(value = "Authorization", required = false) String token,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size
    ) {
        try {
            // Validate pagination parameters
            if (page < 0) page = 0;
            if (size < 1) size = 20;
            if (size > 100) size = 100; // Max 100 items per page
            
            var pageResult = complaintService.getAllComplaintsPaged(page, size);
            List<ComplaintResponse> responses = pageResult.getContent().stream()
                .map(complaint -> new ComplaintResponse(
                    complaint.getId(),
                    complaint.getMealType(),
                    complaint.getFoodItem(),
                    complaint.getDate(),
                    complaint.getReasons(),
                    complaint.getComments(),
                    complaint.getComplaintCount(),
                    complaint.getAgreeVotes(),
                    complaint.getDisagreeVotes(),
                    complaint.getStatus()
                ))
                .toList();
            
            PaginatedResponse<ComplaintResponse> response = new PaginatedResponse<>(
                responses,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalPages(),
                pageResult.getTotalElements()
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error fetching complaints: " + e.getMessage()));
        }
    }
    
    /**
     * Get high-priority complaints (admin dashboard)
     * GET /api/complaints/admin/high-priority
     */
    @GetMapping("/admin/high-priority")
    public ResponseEntity<?> getHighPriorityComplaints() {
        try {
            List<ComplaintResponse> complaints = complaintService.getHighPriorityComplaints();
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Get paginated complaints by status (admin filtering)
     * GET /api/complaints/admin/status/{status}?page=0&size=20
     */
    @GetMapping("/admin/status/{status}")
    public ResponseEntity<?> getComplaintsByStatus(
        @PathVariable String status,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size
    ) {
        try {
            // Validate pagination parameters
            if (page < 0) page = 0;
            if (size < 1) size = 20;
            if (size > 100) size = 100; // Max 100 items per page
            
            var pageResult = complaintService.getComplaintsByStatusPaged(status, page, size);
            List<ComplaintResponse> responses = pageResult.getContent().stream()
                .map(complaint -> new ComplaintResponse(
                    complaint.getId(),
                    complaint.getMealType(),
                    complaint.getFoodItem(),
                    complaint.getDate(),
                    complaint.getReasons(),
                    complaint.getComments(),
                    complaint.getComplaintCount(),
                    complaint.getAgreeVotes(),
                    complaint.getDisagreeVotes(),
                    complaint.getStatus()
                ))
                .toList();
            
            PaginatedResponse<ComplaintResponse> response = new PaginatedResponse<>(
                responses,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalPages(),
                pageResult.getTotalElements()
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Get complaint statistics (admin dashboard)
     * GET /api/complaints/admin/stats
     */
    @GetMapping("/admin/stats")
    public ResponseEntity<?> getStats() {
        try {
            Map<String, Object> stats = complaintService.getComplaintStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Update complaint status (admin only)
     * PUT /api/complaints/admin/{complaintId}/status
     */
    @PutMapping("/admin/{complaintId}/status")
    public ResponseEntity<?> updateComplaintStatus(
        @PathVariable String complaintId,
        @RequestBody Map<String, String> payload) {
        try {
            String newStatus = payload.get("status");
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Status is required"));
            }
            
            ComplaintResponse response = complaintService.updateComplaintStatusAdmin(complaintId, newStatus);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Delete a complaint (admin only)
     * DELETE /api/complaints/admin/{complaintId}
     */
    @DeleteMapping("/admin/{complaintId}")
    public ResponseEntity<?> deleteComplaint(@PathVariable String complaintId) {
        try {
            complaintService.deleteComplaint(complaintId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Complaint deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Helper method to create error response
     */
    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> response = new HashMap<>();
        response.put("error", message);
        return response;
    }
}
