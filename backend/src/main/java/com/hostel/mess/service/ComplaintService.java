package com.hostel.mess.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hostel.mess.dto.ComplaintRequest;
import com.hostel.mess.dto.ComplaintResponse;
import com.hostel.mess.model.Complaint;
import com.hostel.mess.repository.ComplaintRepository;

@Service
public class ComplaintService {
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final int COMPLAINT_THRESHOLD = 5; // Min complaints to flag
    private static final double REMOVAL_VOTE_PERCENTAGE = 70.0; // 70% agreement needed
    
    @Autowired
    private ComplaintRepository complaintRepository;
    
    /**
     * Raise a new complaint against a food item
     */
    public ComplaintResponse raiseComplaint(ComplaintRequest request) {
        String today = LocalDate.now().format(DATE_FORMATTER);
        
        // Find existing complaint for same food item
        Optional<Complaint> existingComplaint = complaintRepository
            .findByMealTypeAndFoodItemAndDate(request.getMealType(), request.getFoodItem(), today);
        
        Complaint complaint;
        if (existingComplaint.isPresent()) {
            complaint = existingComplaint.get();
            complaint.setComplaintCount(complaint.getComplaintCount() + 1);
        } else {
            complaint = new Complaint(request.getMealType(), request.getFoodItem(), today);
            complaint.setComplaintCount(1);
        }
        
        // Add reasons and comments
        if (request.getReasons() != null) {
            complaint.setReasons(request.getReasons());
        } else {
            complaint.setReasons(new ArrayList<>());
        }
        
        List<String> comments = complaint.getComments();
        if (comments == null) {
            comments = new ArrayList<>();
        }
        if (request.getComment() != null && !request.getComment().trim().isEmpty()) {
            comments.add(request.getComment());
            complaint.setComments(comments);
        }
        
        // Update status based on complaint count and vote percentage
        complaint.setUpdatedAt(Instant.now());
        updateComplaintStatus(complaint);
        
        Complaint saved = complaintRepository.save(complaint);
        return convertToResponse(saved);
    }
    
    /**
     * Vote on a complaint (AGREE or DISAGREE)
     */
    public ComplaintResponse voteOnComplaint(String complaintId, String vote, String userId) {
        Optional<Complaint> optional = complaintRepository.findById(complaintId);
        
        if (!optional.isPresent()) {
            throw new RuntimeException("Complaint not found: " + complaintId);
        }
        
        Complaint complaint = optional.get();
        
        // Check if user has already voted
        if (complaint.hasUserVoted(userId)) {
            throw new RuntimeException("You have already voted on this complaint");
        }
        
        if ("AGREE".equalsIgnoreCase(vote)) {
            complaint.setAgreeVotes(complaint.getAgreeVotes() + 1);
        } else if ("DISAGREE".equalsIgnoreCase(vote)) {
            complaint.setDisagreeVotes(complaint.getDisagreeVotes() + 1);
        }
        
        // Add user to voted users set
        complaint.addVoter(userId);
        
        complaint.setUpdatedAt(Instant.now());
        updateComplaintStatus(complaint);
        
        Complaint updated = complaintRepository.save(complaint);
        return convertToResponse(updated);
    }
    
    /**
     * Get all complaints for a specific meal type on today's date
     */
    public List<ComplaintResponse> getComplaintsByMealToday(String mealType) {
        String today = LocalDate.now().format(DATE_FORMATTER);
        List<Complaint> complaints = complaintRepository.findByMealTypeAndDateOrderByUpdatedAtDesc(mealType, today);
        
        return complaints.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get all complaints for a specific date
     */
    public List<ComplaintResponse> getComplaintsByDate(String date) {
        List<Complaint> complaints = complaintRepository.findAll()
            .stream()
            .filter(c -> c.getDate().equals(date))
            .collect(Collectors.toList());
        
        return complaints.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Update complaint status based on complaint count and voting
     */
    private void updateComplaintStatus(Complaint complaint) {
        int complaints = complaint.getComplaintCount();
        int agreeVotes = complaint.getAgreeVotes();
        int disagreeVotes = complaint.getDisagreeVotes();
        int totalVotes = agreeVotes + disagreeVotes;
        
        // Rule 1: If 5+ complaints AND 70% agreement -> REMOVAL_REQUESTED
        if (complaints >= COMPLAINT_THRESHOLD && totalVotes > 0) {
            double agreePercentage = (double) agreeVotes / totalVotes * 100;
            
            if (agreePercentage >= REMOVAL_VOTE_PERCENTAGE) {
                complaint.setStatus("REMOVAL_REQUESTED");
                return;
            }
        }
        
        // Rule 2: If 3-4 complaints with some agreement -> NEEDS_IMPROVEMENT
        if (complaints >= 3 && totalVotes > 0) {
            double agreePercentage = (double) agreeVotes / totalVotes * 100;
            
            if (agreePercentage >= 50) {
                complaint.setStatus("NEEDS_IMPROVEMENT");
                return;
            }
        }
        
        // Default: PENDING
        complaint.setStatus("PENDING");
    }
    
    /**
     * Get all complaints (admin view)
     */
    public List<ComplaintResponse> getAllComplaints() {
        return complaintRepository.findAll()
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get complaints by status (admin filtering)
     */
    public List<ComplaintResponse> getComplaintsByStatus(String status) {
        return complaintRepository.findAll()
            .stream()
            .filter(c -> status.equalsIgnoreCase(c.getStatus()))
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get high-priority complaints (5+ complaints + 70% agreement)
     */
    public List<ComplaintResponse> getHighPriorityComplaints() {
        return getComplaintsByStatus("REMOVAL_REQUESTED");
    }
    
    /**
     * Admin can delete a complaint
     */
    public void deleteComplaint(String complaintId) {
        complaintRepository.deleteById(complaintId);
    }
    
    /**
     * Admin can update complaint status manually
     */
    public ComplaintResponse updateComplaintStatusAdmin(String complaintId, String newStatus) {
        Optional<Complaint> optional = complaintRepository.findById(complaintId);
        
        if (!optional.isPresent()) {
            throw new RuntimeException("Complaint not found");
        }
        
        Complaint complaint = optional.get();
        complaint.setStatus(newStatus);
        complaint.setUpdatedAt(Instant.now());
        
        Complaint updated = complaintRepository.save(complaint);
        return convertToResponse(updated);
    }
    
    /**
     * Get complaint statistics
     */
    public Map<String, Object> getComplaintStats() {
        List<Complaint> allComplaints = complaintRepository.findAll();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalComplaints", allComplaints.size());
        stats.put("pending", allComplaints.stream()
            .filter(c -> "PENDING".equalsIgnoreCase(c.getStatus()))
            .count());
        stats.put("needsImprovement", allComplaints.stream()
            .filter(c -> "NEEDS_IMPROVEMENT".equalsIgnoreCase(c.getStatus()))
            .count());
        stats.put("removalRequested", allComplaints.stream()
            .filter(c -> "REMOVAL_REQUESTED".equalsIgnoreCase(c.getStatus()))
            .count());
        stats.put("resolved", allComplaints.stream()
            .filter(c -> "RESOLVED".equalsIgnoreCase(c.getStatus()))
            .count());
        
        // By meal type
        Map<String, Long> byMealType = new HashMap<>();
        for (String meal : Arrays.asList("BREAKFAST", "LUNCH", "SNACKS", "DINNER")) {
            byMealType.put(meal, allComplaints.stream()
                .filter(c -> meal.equalsIgnoreCase(c.getMealType()))
                .count());
        }
        stats.put("byMealType", byMealType);
        
        return stats;
    }

    /**
     * Convert Complaint entity to ComplaintResponse DTO
     */
    private ComplaintResponse convertToResponse(Complaint complaint) {
        return new ComplaintResponse(
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
        );
    }
}
