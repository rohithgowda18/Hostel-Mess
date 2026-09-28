package com.hostel.mess.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hostel.mess.dto.UserInfo;
import com.hostel.mess.model.Complaint;
import com.hostel.mess.model.Group;
import com.hostel.mess.model.MealAttendance;
import com.hostel.mess.model.MealSubmission;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.ComplaintRepository;
import com.hostel.mess.repository.GroupRepository;
import com.hostel.mess.repository.MealAttendanceRepository;
import com.hostel.mess.repository.MealSubmissionRepository;
import com.hostel.mess.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MealSubmissionRepository submissionRepository;

    @Autowired
    private MealAttendanceRepository attendanceRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    public Optional<UserInfo> getMyProfile(String userId) {
        return userRepository.findById(userId).map(this::toUserInfo);
    }

    public Optional<UserInfo> updateMyProfile(String userId, UserInfo update) {
        return userRepository.findById(userId).map(user -> {
            user.setHostel(update.getHostel());
            user.setFloor(update.getFloor());
            user.setRoomNumber(update.getRoomNumber());
            user.setYear(update.getYear());
            user.setBranch(update.getBranch());
            user.setDirectoryVisible(update.getDirectoryVisible());
            user.setPhoneNumber(update.getPhoneNumber());
            user.setProfilePhoto(update.getProfilePhoto());
            if (update.getFavoriteFoods() != null) {
                user.setFavoriteFoods(update.getFavoriteFoods());
            }
            userRepository.save(user);
            return toUserInfo(user);
        });
    }

    public Optional<UserInfo> getPublicProfile(String userId) {
        return userRepository.findById(userId).map(user -> {
            if (Boolean.FALSE.equals(user.getDirectoryVisible())) {
                return new UserInfo(
                        user.getId(), "private@hostel.com", user.getHostel(), null,
                        user.getYear(), user.getBranch(), user.getRole(),
                        user.getFloor(), false, null, null, new ArrayList<>()
                );
            }
            return toUserInfo(user);
        });
    }

    public List<String> getFavorites(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        return user.getFavoriteFoods() != null ? user.getFavoriteFoods() : new ArrayList<>();
    }

    public List<String> saveFavorites(String userId, List<String> items) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setFavoriteFoods(items != null ? items : new ArrayList<>());
        userRepository.save(user);
        return user.getFavoriteFoods();
    }

    public List<MealSubmission> getMyReports(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        return submissionRepository.findByStudentEmail(user.getEmail());
    }

    public Map<String, Object> getProfileStats(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        List<MealSubmission> submissions = submissionRepository.findByStudentEmail(user.getEmail());
        long photoCount = submissions.stream()
                .filter(s -> s.getPhotoUrl() != null && !s.getPhotoUrl().isEmpty())
                .count();

        List<MealAttendance> attendances = attendanceRepository.findByUserEmail(user.getEmail());
        long checkedInCount = attendances.stream()
                .filter(a -> Boolean.TRUE.equals(a.getPresent()))
                .count();
        int attendanceRate = attendances.size() > 0
                ? (int) Math.round(((double) checkedInCount / attendances.size()) * 100)
                : 95;

        List<User> allUsers = userRepository.findAll();
        allUsers.sort((a, b) -> Integer.compare(b.getPoints(), a.getPoints()));
        int rank = 1;
        for (int i = 0; i < allUsers.size(); i++) {
            if (allUsers.get(i).getEmail().equalsIgnoreCase(user.getEmail())) {
                rank = i + 1;
                break;
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("points", user.getPoints());
        stats.put("reportsSubmitted", submissions.size());
        stats.put("photosUploaded", photoCount);
        stats.put("mealsCheckedIn", checkedInCount);
        stats.put("attendanceRate", attendanceRate);
        stats.put("badges", user.getBadges());
        stats.put("rank", rank);
        stats.put("totalUsers", allUsers.size());
        return stats;
    }

    public List<Map<String, Object>> getLeaderboard() {
        List<User> users = userRepository.findAll();
        users.sort((a, b) -> Integer.compare(b.getPoints(), a.getPoints()));
        List<Map<String, Object>> leaderboard = new ArrayList<>();
        int rank = 1;
        for (User u : users) {
            if (leaderboard.size() >= 10) break;
            Map<String, Object> entry = new HashMap<>();
            entry.put("rank", rank++);
            entry.put("email", u.getEmail());
            entry.put("hostel", u.getHostel());
            entry.put("points", u.getPoints());
            entry.put("badges", u.getBadges());
            entry.put("profilePhoto", u.getProfilePhoto());
            leaderboard.add(entry);
        }
        return leaderboard;
    }

    public Map<String, Object> universalSearch(String q) {
        String query = q == null ? "" : q.trim().toLowerCase();
        Map<String, Object> result = new HashMap<>();
        result.put("meals", List.of());
        result.put("groups", List.of());
        result.put("complaints", List.of());
        result.put("users", List.of());

        if (query.isEmpty()) {
            return result;
        }

        List<Map<String, Object>> meals = submissionRepository.findAll().stream()
                .filter(s -> matchesMeal(s, query))
                .limit(10)
                .map(s -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", s.getId());
                    m.put("mealType", s.getMealType());
                    m.put("date", s.getDate());
                    m.put("items", s.getSelectedItems());
                    return m;
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> groups = groupRepository.findAll().stream()
                .filter(g -> containsIgnoreCase(g.getName(), query) || containsIgnoreCase(g.getGroupCode(), query))
                .limit(10)
                .map(g -> {
                    Map<String, Object> gm = new HashMap<>();
                    gm.put("id", g.getId());
                    gm.put("name", g.getName());
                    gm.put("groupCode", g.getGroupCode());
                    return gm;
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> complaints = complaintRepository.findAll().stream()
                .filter(c -> containsIgnoreCase(c.getFoodItem(), query)
                        || containsIgnoreCase(c.getMealType(), query)
                        || containsIgnoreCase(c.getStatus(), query))
                .limit(10)
                .map(c -> {
                    Map<String, Object> cm = new HashMap<>();
                    cm.put("id", c.getId());
                    cm.put("foodItem", c.getFoodItem());
                    cm.put("status", c.getStatus());
                    cm.put("mealType", c.getMealType());
                    cm.put("date", c.getDate());
                    return cm;
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> users = userRepository.findAll().stream()
                .filter(u -> containsIgnoreCase(u.getEmail(), query)
                        || containsIgnoreCase(u.getHostel(), query)
                        || containsIgnoreCase(u.getBranch(), query))
                .limit(10)
                .map(u -> {
                    Map<String, Object> um = new HashMap<>();
                    um.put("id", u.getId());
                    um.put("email", u.getEmail());
                    um.put("hostel", u.getHostel());
                    um.put("branch", u.getBranch());
                    return um;
                })
                .collect(Collectors.toList());

        result.put("meals", meals);
        result.put("groups", groups);
        result.put("complaints", complaints);
        result.put("users", users);
        return result;
    }

    private UserInfo toUserInfo(User user) {
        return new UserInfo(
                user.getId(), user.getEmail(), user.getHostel(), user.getRoomNumber(),
                user.getYear(), user.getBranch(), user.getRole(),
                user.getFloor(), user.getDirectoryVisible(), user.getPhoneNumber(),
                user.getProfilePhoto(), user.getFavoriteFoods()
        );
    }

    private boolean matchesMeal(MealSubmission s, String query) {
        if (containsIgnoreCase(s.getMealType(), query)) return true;
        if (s.getSelectedItems() != null) {
            for (String item : s.getSelectedItems()) {
                if (containsIgnoreCase(item, query)) return true;
            }
        }
        return false;
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase().contains(query);
    }
}
