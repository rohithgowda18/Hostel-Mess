package com.hostel.mess.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.hostel.mess.dto.ChatRequest;
import com.hostel.mess.dto.ChatResponse;
import com.hostel.mess.dto.ComplaintRequest;
import com.hostel.mess.dto.ComplaintResponse;
import com.hostel.mess.dto.GroupMealStatusResponse;
import com.hostel.mess.dto.GroupResponse;
import com.hostel.mess.model.*;
import com.hostel.mess.repository.*;

@Service
public class CommunityService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final String CHAR_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 8;
    private static final int GROUP_CHAT_MESSAGE_MAX_LENGTH = 500;

    @Autowired
    private FoodRatingRepository ratingRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMealStatusRepository groupMealStatusRepository;

    @Autowired
    private ChatMessageRepository chatRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private WebSocketEventService wsService;

    @Autowired(required = false)
    private NotificationService notificationService;

    // ==========================================
    // 1. FOOD RATINGS
    // ==========================================

    public FoodRating saveOrUpdateRating(FoodRating rating) {
        Optional<FoodRating> existing = ratingRepository.findByUserEmailAndMealTypeAndDate(
                rating.getUserEmail(), rating.getMealType(), rating.getDate()
        );

        FoodRating saved;
        if (existing.isPresent()) {
            FoodRating f = existing.get();
            f.setRatingOverall(rating.getRatingOverall());
            f.setTaste(rating.getTaste());
            f.setQuality(rating.getQuality());
            f.setQuantity(rating.getQuantity());
            f.setTemperature(rating.getTemperature());
            f.setCleanliness(rating.getCleanliness());
            f.setPresentation(rating.getPresentation());
            f.setReviewText(rating.getReviewText());
            f.setCreatedAt(Instant.now());
            saved = ratingRepository.save(f);
        } else {
            saved = ratingRepository.save(rating);
        }

        if (wsService != null) {
            wsService.broadcastAppEvent("RATINGS_UPDATED", Map.of(
                    "mealType", rating.getMealType(),
                    "date", rating.getDate(),
                    "rating", saved
            ));
        }

        return saved;
    }

    public List<FoodRating> getMealRatings(String mealType, String date) {
        return ratingRepository.findByMealTypeAndDate(mealType, date);
    }

    public FoodRating getUserRating(String userEmail, String mealType, String date) {
        return ratingRepository.findByUserEmailAndMealTypeAndDate(userEmail, mealType, date).orElse(null);
    }

    public Map<String, Object> getMealRatingsSummary(String mealType, String date) {
        List<FoodRating> ratings = getMealRatings(mealType, date);
        double avgOverall = 0, avgTaste = 0, avgQuality = 0, avgQuantity = 0, avgTemperature = 0, avgCleanliness = 0, avgPresentation = 0;
        int[] distribution = new int[6];

        for (FoodRating r : ratings) {
            avgOverall += r.getRatingOverall();
            avgTaste += r.getTaste();
            avgQuality += r.getQuality();
            avgQuantity += r.getQuantity();
            avgTemperature += r.getTemperature();
            avgCleanliness += r.getCleanliness();
            avgPresentation += r.getPresentation();

            int overall = r.getRatingOverall();
            if (overall >= 1 && overall <= 5) {
                distribution[overall]++;
            }
        }

        int count = ratings.size();
        if (count > 0) {
            avgOverall /= count;
            avgTaste /= count;
            avgQuality /= count;
            avgQuantity /= count;
            avgTemperature /= count;
            avgCleanliness /= count;
            avgPresentation /= count;
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("mealType", mealType);
        summary.put("date", date);
        summary.put("totalRatings", count);
        summary.put("averageOverall", Math.round(avgOverall * 100.0) / 100.0);
        summary.put("averageTaste", Math.round(avgTaste * 100.0) / 100.0);
        summary.put("averageQuality", Math.round(avgQuality * 100.0) / 100.0);
        summary.put("averageQuantity", Math.round(avgQuantity * 100.0) / 100.0);
        summary.put("averageTemperature", Math.round(avgTemperature * 100.0) / 100.0);
        summary.put("averageCleanliness", Math.round(avgCleanliness * 100.0) / 100.0);
        summary.put("averagePresentation", Math.round(avgPresentation * 100.0) / 100.0);
        summary.put("distribution", distribution);
        return summary;
    }

    // ==========================================
    // 2. COMPLAINTS
    // ==========================================

    public ComplaintResponse raiseComplaint(ComplaintRequest request) {
        String today = LocalDate.now().format(DATE_FORMATTER);

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

        complaint.setUpdatedAt(Instant.now());
        updateComplaintStatusLogic(complaint);

        Complaint saved = complaintRepository.save(complaint);
        ComplaintResponse response = convertComplaintToResponse(saved);

        if (wsService != null) {
            wsService.broadcastAppEvent("COMPLAINT_UPDATED", response);
        }

        return response;
    }

    public List<ComplaintResponse> getComplaintsByMealToday(String mealType) {
        String today = LocalDate.now().format(DATE_FORMATTER);
        List<Complaint> complaints = complaintRepository.findByMealTypeAndDate(mealType, today);
        return complaints.stream()
                .map(this::convertComplaintToResponse)
                .collect(Collectors.toList());
    }

    public ComplaintResponse voteOnComplaint(String complaintId, String vote, String userId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + complaintId));

        if (complaint.hasUserVoted(userId)) {
            throw new RuntimeException("You have already voted on this complaint");
        }

        if ("AGREE".equalsIgnoreCase(vote)) {
            complaint.addAgreeVote(userId);
        } else if ("DISAGREE".equalsIgnoreCase(vote)) {
            complaint.addDisagreeVote(userId);
        }

        updateComplaintStatusLogic(complaint);
        complaint.setUpdatedAt(Instant.now());

        Complaint saved = complaintRepository.save(complaint);
        ComplaintResponse response = convertComplaintToResponse(saved);

        if (wsService != null) {
            wsService.broadcastAppEvent("COMPLAINT_VOTED", response);
        }

        return response;
    }

    private void updateComplaintStatusLogic(Complaint complaint) {
        if (complaint.getComplaintCount() >= 5) {
            complaint.setStatus("FLAGGED_FOR_REVIEW");
        }
        if (complaint.getTotalVotes() >= 10 && complaint.getAgreePercentage() >= 70.0) {
            complaint.setStatus("RECOMMENDED_FOR_REMOVAL");
        }
    }

    private ComplaintResponse convertComplaintToResponse(Complaint complaint) {
        ComplaintResponse response = new ComplaintResponse();
        response.setId(complaint.getId());
        response.setMealType(complaint.getMealType());
        response.setFoodItem(complaint.getFoodItem());
        response.setDate(complaint.getDate());
        response.setComplaintCount(complaint.getComplaintCount());
        response.setReasons(complaint.getReasons());
        response.setComments(complaint.getComments());
        response.setAgreeVotes(complaint.getAgreeVotes());
        response.setDisagreeVotes(complaint.getDisagreeVotes());
        response.setAgreePercentage(complaint.getAgreePercentage());
        response.setStatus(complaint.getStatus());
        response.setCreatedAt(complaint.getCreatedAt());
        response.setUpdatedAt(complaint.getUpdatedAt());
        return response;
    }

    // ==========================================
    // 3. GROUPS
    // ==========================================

    public Group createGroup(String name, String userId) {
        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("Group name is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        String groupCode = generateUniqueGroupCode();
        List<String> members = new ArrayList<>();
        members.add(user.getEmail());

        Group group = new Group(name, groupCode, members, user.getEmail(), user.getId());
        return groupRepository.save(group);
    }

    public Group joinGroup(String groupCode, String userId) {
        if (groupCode == null || groupCode.trim().isEmpty()) {
            throw new RuntimeException("Group code is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Group group = groupRepository.findByGroupCode(groupCode.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Group not found with this code"));

        String userEmail = user.getEmail();
        if (group.getMembers().contains(userEmail)) {
            throw new RuntimeException("You are already a member of this group");
        }

        group.getMembers().add(userEmail);
        return groupRepository.save(group);
    }

    public List<Group> getUserGroups(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        return groupRepository.findByMembersContaining(user.getEmail());
    }

    public Group getGroupDetails(String groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));
    }

    public void leaveGroup(String groupId, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));

        String userEmail = user.getEmail();
        if (!group.getMembers().contains(userEmail)) {
            throw new RuntimeException("You are not a member of this group");
        }

        group.getMembers().remove(userEmail);
        if (group.getMembers().isEmpty()) {
            deleteGroupInternal(group);
        } else {
            if (group.isOwner(user.getId(), userEmail)) {
                // Transfer ownership to first remaining member
                String nextOwner = group.getMembers().get(0);
                group.setCreatedBy(nextOwner);
                userRepository.findByEmail(nextOwner).ifPresent(u -> group.setCreatorId(u.getId()));
            }
            groupRepository.save(group);
        }
    }

    public void removeMember(String groupId, String memberEmailOrId, String currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found: " + currentUserId));
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));

        if (!group.isOwner(currentUser.getId(), currentUser.getEmail())) {
            throw new org.springframework.security.access.AccessDeniedException("Only the group admin can remove members");
        }

        if (group.isOwner(null, memberEmailOrId) || currentUser.getEmail().equalsIgnoreCase(memberEmailOrId) || currentUser.getId().equals(memberEmailOrId)) {
            throw new RuntimeException("Group admin cannot remove themselves. Delete the group instead.");
        }

        boolean removed = group.getMembers().removeIf(m -> m.equalsIgnoreCase(memberEmailOrId) || m.equals(memberEmailOrId));
        if (!removed) {
            throw new RuntimeException("Member not found in group: " + memberEmailOrId);
        }

        groupRepository.save(group);

        if (wsService != null) {
            wsService.broadcast("/topic/chat/" + groupId, Map.of(
                    "type", "MEMBER_REMOVED",
                    "member", memberEmailOrId,
                    "groupId", groupId,
                    "message", memberEmailOrId + " was removed from the group by the admin."
            ));
        }

        if (notificationService != null) {
            notificationService.createAndSend(
                    memberEmailOrId,
                    "Removed from Group",
                    "You have been removed from group \"" + group.getName() + "\" by the group admin.",
                    "GROUP_MEMBER_REMOVED",
                    "/student/groups"
            );
        }
    }

    public void deleteGroup(String groupId, String currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found: " + currentUserId));
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));

        if (!group.isOwner(currentUser.getId(), currentUser.getEmail())) {
            throw new org.springframework.security.access.AccessDeniedException("Only the group admin can delete this group");
        }

        // Notify members
        if (wsService != null) {
            wsService.broadcast("/topic/chat/" + groupId, Map.of(
                    "type", "GROUP_DELETED",
                    "groupId", groupId,
                    "groupName", group.getName(),
                    "message", "This group was deleted by the admin."
            ));
        }

        if (notificationService != null) {
            for (String memberEmail : group.getMembers()) {
                if (!memberEmail.equalsIgnoreCase(currentUser.getEmail())) {
                    notificationService.createAndSend(
                            memberEmail,
                            "Group Deleted",
                            "Group \"" + group.getName() + "\" has been deleted by the group admin.",
                            "GROUP_DELETED",
                            "/student/groups"
                    );
                }
            }
        }

        deleteGroupInternal(group);
    }

    private void deleteGroupInternal(Group group) {
        String groupId = group.getId();
        // 1. Delete all messages for this group
        try {
            chatRepository.deleteByChatTypeAndChatId("GROUP", groupId);
        } catch (Exception ignored) {}

        // 2. Delete all group meal status records
        try {
            groupMealStatusRepository.deleteByGroupId(groupId);
        } catch (Exception ignored) {}

        // 3. Delete group
        groupRepository.delete(group);
    }

    private String generateUniqueGroupCode() {
        Random random = new Random();
        String code;
        int attempts = 0;
        do {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CHAR_SET.charAt(random.nextInt(CHAR_SET.length())));
            }
            code = sb.toString();
            attempts++;
            if (attempts > 50) {
                code = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                break;
            }
        } while (groupRepository.findByGroupCode(code).isPresent());
        return code;
    }

    // ==========================================
    // 4. GROUP MEAL STATUS
    // ==========================================

    public GroupMealStatus markUserGoing(String groupId, String mealType, String userId, String userEmail) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        boolean isMember = group.getMembers().contains(userEmail) || group.getMembers().contains(userId);
        if (!isMember) {
            throw new RuntimeException("User is not a member of this group");
        }

        Optional<GroupMealStatus> statusOpt = groupMealStatusRepository.findByGroupIdAndMealType(groupId, mealType);
        GroupMealStatus status;

        if (statusOpt.isPresent()) {
            status = statusOpt.get();
            if (status.isExpired()) {
                status.setGoingUsers(new ArrayList<>());
                status.setUpdatedAt(Instant.now());
            }
        } else {
            status = new GroupMealStatus(groupId, mealType, new ArrayList<>());
        }

        if (!status.getGoingUsers().contains(userEmail)) {
            status.getGoingUsers().add(userEmail);
            status.setUpdatedAt(Instant.now());
        }

        GroupMealStatus saved = groupMealStatusRepository.save(status);
        if (wsService != null) {
            wsService.broadcastAppEvent("GROUP_MEAL_STATUS_UPDATED", saved);
        }
        return saved;
    }

    public GroupMealStatus cancelUserGoing(String groupId, String mealType, String userEmail) {
        Optional<GroupMealStatus> statusOpt = groupMealStatusRepository.findByGroupIdAndMealType(groupId, mealType);
        if (statusOpt.isEmpty()) {
            throw new RuntimeException("Meal status not found");
        }

        GroupMealStatus status = statusOpt.get();
        status.getGoingUsers().remove(userEmail);
        status.setUpdatedAt(Instant.now());

        GroupMealStatus saved = groupMealStatusRepository.save(status);
        if (wsService != null) {
            wsService.broadcastAppEvent("GROUP_MEAL_STATUS_UPDATED", saved);
        }
        return saved;
    }

    public GroupMealStatus getGroupMealStatus(String groupId, String mealType) {
        Optional<GroupMealStatus> statusOpt = groupMealStatusRepository.findByGroupIdAndMealType(groupId, mealType);
        if (statusOpt.isEmpty()) {
            return new GroupMealStatus(groupId, mealType, new ArrayList<>());
        }
        GroupMealStatus status = statusOpt.get();
        if (status.isExpired()) {
            status.setGoingUsers(new ArrayList<>());
            groupMealStatusRepository.save(status);
        }
        return status;
    }

    // ==========================================
    // 5. GROUP CHAT
    // ==========================================

    public List<ChatResponse> getMessages(String chatType, String chatId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String targetType = (chatType != null && !chatType.trim().isEmpty()) ? chatType.toUpperCase() : "GROUP";
        Page<ChatMessage> messagePage = chatRepository.findNonExpiredByChatTypeAndChatIdPaged(targetType, chatId, Instant.now(), pageable);

        return messagePage.getContent().stream()
                .map(ChatResponse::new)
                .collect(Collectors.toList());
    }

    public ChatResponse sendMessage(String senderId, String senderEmail, String chatType, String chatId, String message) {
        if (message == null || message.trim().isEmpty()) {
            throw new RuntimeException("Message content cannot be empty");
        }
        if (message.length() > GROUP_CHAT_MESSAGE_MAX_LENGTH) {
            throw new RuntimeException("Message exceeds maximum length of " + GROUP_CHAT_MESSAGE_MAX_LENGTH);
        }

        String targetType = (chatType != null && !chatType.trim().isEmpty()) ? chatType.toUpperCase() : "GROUP";

        if ("GROUP".equalsIgnoreCase(targetType)) {
            Group group = groupRepository.findById(chatId)
                    .orElseThrow(() -> new RuntimeException("Group not found"));
            boolean isMember = group.getMembers().contains(senderEmail) || group.getMembers().contains(senderId);
            if (!isMember) {
                throw new RuntimeException("User is not a member of this group");
            }
        }

        Instant expiresAt = "UNIVERSAL".equalsIgnoreCase(targetType) ? Instant.now().plusSeconds(24 * 3600) : null;
        String displayName = (senderEmail != null && senderEmail.contains("@"))
                ? senderEmail.split("@")[0]
                : (senderEmail != null ? senderEmail : "Student");
        ChatMessage chatMessage = new ChatMessage(targetType, chatId, senderId, senderEmail, displayName, "STUDENT", message, expiresAt);
        ChatMessage saved = chatRepository.save(chatMessage);
        ChatResponse response = new ChatResponse(saved);

        if (wsService != null) {
            wsService.broadcast("/topic/chat/" + chatId, response);
            wsService.broadcastAppEvent("CHAT_MESSAGE", response);
        }

        return response;
    }

    public void deleteMessage(String messageId, String userId) {
        ChatMessage message = chatRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!message.getSenderId().equals(userId)) {
            throw new RuntimeException("You can only delete your own messages");
        }

        chatRepository.delete(message);
    }
}
