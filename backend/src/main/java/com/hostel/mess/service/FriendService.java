package com.hostel.mess.service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hostel.mess.model.Friendship;
import com.hostel.mess.model.Notification;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.FriendshipRepository;
import com.hostel.mess.repository.UserRepository;

@Service
public class FriendService {

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private MealService mealService;

    @Autowired(required = false)
    private WebSocketEventService wsService;

    /**
     * Send friend request to target student by email or ID.
     */
    public Friendship sendFriendRequest(String currentUserId, String targetIdentifier) {
        if (targetIdentifier == null || targetIdentifier.trim().isEmpty()) {
            throw new RuntimeException("Student email or ID is required");
        }

        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Sender user not found"));

        String cleanTarget = targetIdentifier.trim();
        User target = userRepository.findByEmail(cleanTarget)
                .or(() -> userRepository.findById(cleanTarget))
                .orElseThrow(() -> new RuntimeException("Student not found with identifier: " + cleanTarget));

        if (sender.getId().equals(target.getId()) || sender.getEmail().equalsIgnoreCase(target.getEmail())) {
            throw new RuntimeException("You cannot send a friend request to yourself");
        }

        Optional<Friendship> existingOpt = friendshipRepository.findRelationship(sender.getId(), target.getId());

        if (existingOpt.isPresent()) {
            Friendship existing = existingOpt.get();
            if ("ACCEPTED".equalsIgnoreCase(existing.getStatus())) {
                throw new RuntimeException("You are already friends with " + target.getEmail());
            }
            if ("PENDING".equalsIgnoreCase(existing.getStatus())) {
                if (existing.getRequesterId().equals(sender.getId())) {
                    throw new RuntimeException("Friend request is already pending");
                } else {
                    // Mutual request: sender is accepting the existing incoming request!
                    existing.setStatus("ACCEPTED");
                    existing.setUpdatedAt(Instant.now());
                    Friendship saved = friendshipRepository.save(existing);
                    notifyAcceptance(sender, target);
                    return saved;
                }
            }
            // If REJECTED, reset to PENDING with current user as requester
            existing.setRequesterId(sender.getId());
            existing.setRequesterEmail(sender.getEmail());
            existing.setReceiverId(target.getId());
            existing.setReceiverEmail(target.getEmail());
            existing.setStatus("PENDING");
            existing.setUpdatedAt(Instant.now());
            Friendship saved = friendshipRepository.save(existing);
            sendRequestNotification(sender, target, saved.getId());
            return saved;
        }

        Friendship friendship = new Friendship(
                sender.getId(),
                sender.getEmail(),
                target.getId(),
                target.getEmail(),
                "PENDING"
        );
        Friendship saved = friendshipRepository.save(friendship);
        sendRequestNotification(sender, target, saved.getId());
        return saved;
    }

    /**
     * Accept friend request. Only the recipient can accept.
     */
    public Friendship acceptFriendRequest(String currentUserId, String requestId) {
        Friendship friendship = friendshipRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Friend request not found"));

        if (!currentUserId.equals(friendship.getReceiverId())) {
            throw new org.springframework.security.access.AccessDeniedException("You are not authorized to accept this friend request");
        }

        if ("ACCEPTED".equalsIgnoreCase(friendship.getStatus())) {
            return friendship;
        }

        friendship.setStatus("ACCEPTED");
        friendship.setUpdatedAt(Instant.now());
        Friendship saved = friendshipRepository.save(friendship);

        User receiver = userRepository.findById(friendship.getReceiverId()).orElse(null);
        User requester = userRepository.findById(friendship.getRequesterId()).orElse(null);
        if (receiver != null && requester != null) {
            notifyAcceptance(receiver, requester);
        }

        return saved;
    }

    /**
     * Reject friend request. Only the recipient can reject.
     */
    public void rejectFriendRequest(String currentUserId, String requestId) {
        Friendship friendship = friendshipRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Friend request not found"));

        if (!currentUserId.equals(friendship.getReceiverId())) {
            throw new org.springframework.security.access.AccessDeniedException("You are not authorized to reject this friend request");
        }

        friendshipRepository.delete(friendship);
    }

    /**
     * Remove mutual friend.
     */
    public void removeFriend(String currentUserId, String friendId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        friendshipRepository.deleteRelationship(currentUserId, friendId);

        // Also clean up from notifyFriendIds
        if (currentUser.getNotifyFriendIds().contains(friendId)) {
            currentUser.getNotifyFriendIds().remove(friendId);
            userRepository.save(currentUser);
        }

        userRepository.findById(friendId).ifPresent(f -> {
            if (f.getNotifyFriendIds().contains(currentUserId)) {
                f.getNotifyFriendIds().remove(currentUserId);
                userRepository.save(f);
            }
        });
    }

    /**
     * Get complete friends data: accepted friends, incoming requests, sent requests, notify list.
     */
    public Map<String, Object> getFriendsData(String currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<String> notifyIds = currentUser.getNotifyFriendIds();

        // 1. Accepted friends
        List<Friendship> acceptedFriendships = friendshipRepository.findAcceptedFriends(currentUserId);
        Set<String> friendUserIds = new HashSet<>();
        for (Friendship f : acceptedFriendships) {
            if (currentUserId.equals(f.getRequesterId())) {
                friendUserIds.add(f.getReceiverId());
            } else {
                friendUserIds.add(f.getRequesterId());
            }
        }

        List<User> friendUsers = userRepository.findAllById(friendUserIds);
        List<Map<String, Object>> friendsList = friendUsers.stream().map(u -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", u.getId());
            map.put("email", u.getEmail());
            map.put("hostel", u.getHostel());
            map.put("roomNumber", u.getRoomNumber());
            map.put("branch", u.getBranch());
            map.put("isNotifyFriend", notifyIds.contains(u.getId()));
            return map;
        }).collect(Collectors.toList());

        // 2. Incoming pending requests
        List<Friendship> incoming = friendshipRepository.findByReceiverIdAndStatusOrderByCreatedAtDesc(currentUserId, "PENDING");
        List<Map<String, Object>> incomingList = incoming.stream().map(f -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", f.getId());
            map.put("requesterId", f.getRequesterId());
            map.put("requesterEmail", f.getRequesterEmail());
            map.put("createdAt", f.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        // 3. Sent pending requests
        List<Friendship> sent = friendshipRepository.findByRequesterIdAndStatusOrderByCreatedAtDesc(currentUserId, "PENDING");
        List<Map<String, Object>> sentList = sent.stream().map(f -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", f.getId());
            map.put("receiverId", f.getReceiverId());
            map.put("receiverEmail", f.getReceiverEmail());
            map.put("createdAt", f.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("friends", friendsList);
        response.put("incomingRequests", incomingList);
        response.put("sentRequests", sentList);
        response.put("notifyFriendIds", notifyIds);
        return response;
    }

    /**
     * Update Notify Friends preference.
     * Backend strictly verifies that all selected users are actually mutual accepted friends.
     */
    public List<String> updateNotifyFriends(String currentUserId, List<String> requestedIds) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (requestedIds == null || requestedIds.isEmpty()) {
            currentUser.setNotifyFriendIds(new ArrayList<>());
            userRepository.save(currentUser);
            return Collections.emptyList();
        }

        // Verify mutual friends
        List<Friendship> acceptedFriendships = friendshipRepository.findAcceptedFriends(currentUserId);
        Set<String> validFriendIds = new HashSet<>();
        for (Friendship f : acceptedFriendships) {
            if (currentUserId.equals(f.getRequesterId())) {
                validFriendIds.add(f.getReceiverId());
            } else {
                validFriendIds.add(f.getRequesterId());
            }
        }

        List<String> validatedIds = requestedIds.stream()
                .filter(validFriendIds::contains)
                .distinct()
                .collect(Collectors.toList());

        currentUser.setNotifyFriendIds(validatedIds);
        userRepository.save(currentUser);
        return validatedIds;
    }

    /**
     * Send Come to Meal notification to Notify Friends.
     */
    public Map<String, Object> sendMealCall(String currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> slotInfo = mealService.getActiveSlotInfo();
        Boolean isActive = (Boolean) slotInfo.get("isActive");
        String activeSlot = (String) slotInfo.get("activeSlot");

        if (isActive == null || !isActive || activeSlot == null) {
            throw new RuntimeException("Cannot send meal call: No meal is currently active in the dining hall.");
        }

        List<String> notifyIds = currentUser.getNotifyFriendIds();
        if (notifyIds == null || notifyIds.isEmpty()) {
            throw new RuntimeException("You have zero friends selected in Notify Friends. Please select friends in your Profile.");
        }

        // Verify friends are still accepted friends
        List<Friendship> acceptedFriendships = friendshipRepository.findAcceptedFriends(currentUserId);
        Set<String> validFriendIds = new HashSet<>();
        for (Friendship f : acceptedFriendships) {
            if (currentUserId.equals(f.getRequesterId())) {
                validFriendIds.add(f.getReceiverId());
            } else {
                validFriendIds.add(f.getRequesterId());
            }
        }

        List<String> recipients = notifyIds.stream()
                .filter(validFriendIds::contains)
                .collect(Collectors.toList());

        if (recipients.isEmpty()) {
            throw new RuntimeException("Selected notify friends are no longer active mutual friends.");
        }

        String senderDisplayName = currentUser.getEmail().split("@")[0];
        String mealName = activeSlot.substring(0, 1).toUpperCase() + activeSlot.substring(1).toLowerCase();
        String message = mealName + " is being served now.";

        int count = 0;
        List<User> targetUsers = userRepository.findAllById(recipients);
        for (User friend : targetUsers) {
            notificationService.sendMealCallNotification(
                    friend.getEmail(),
                    friend.getId(),
                    currentUser.getId(),
                    senderDisplayName,
                    mealName,
                    message
            );
            count++;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("mealType", mealName);
        result.put("notifiedCount", count);
        result.put("message", "Notified " + count + " friends.");
        return result;
    }

    private void sendRequestNotification(User sender, User target, String requestId) {
        notificationService.createAndSend(
                target.getEmail(),
                "New Friend Request",
                sender.getEmail() + " sent you a hostel friend request.",
                "FRIEND_REQUEST",
                "/student/profile"
        );
    }

    private void notifyAcceptance(User receiver, User requester) {
        notificationService.createAndSend(
                requester.getEmail(),
                "Friend Request Accepted",
                receiver.getEmail() + " accepted your friend request. You are now friends!",
                "FRIEND_REQUEST_ACCEPTED",
                "/student/profile"
        );
    }
}
