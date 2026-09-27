package com.hostel.mess.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hostel.mess.model.Complaint;
import com.hostel.mess.model.Group;
import com.hostel.mess.model.MealSubmission;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.ComplaintRepository;
import com.hostel.mess.repository.GroupRepository;
import com.hostel.mess.repository.MealSubmissionRepository;
import com.hostel.mess.repository.UserRepository;

/**
 * Universal search across meals, groups, complaints and students.
 * GET /api/search?q=...
 */
@RestController
public class SearchController {

    @Autowired
    private MealSubmissionRepository submissionRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/api/search")
    public ResponseEntity<?> search(@RequestParam(value = "q", required = false) String q) {
        String query = q == null ? "" : q.trim().toLowerCase();
        Map<String, Object> result = new HashMap<>();
        result.put("meals", List.of());
        result.put("groups", List.of());
        result.put("complaints", List.of());
        result.put("users", List.of());

        if (query.isEmpty()) {
            return ResponseEntity.ok(result);
        }

        // Meals: match mealType or any selected item
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

        // Groups: match name or group code
        List<Map<String, Object>> groups = groupRepository.findAll().stream()
                .filter(g -> containsIgnoreCase(g.getName(), query)
                        || containsIgnoreCase(g.getGroupCode(), query))
                .limit(10)
                .map(g -> {
                    Map<String, Object> gm = new HashMap<>();
                    gm.put("id", g.getId());
                    gm.put("name", g.getName());
                    gm.put("groupCode", g.getGroupCode());
                    return gm;
                })
                .collect(Collectors.toList());

        // Complaints: match food item, meal type or status
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

        // Students: match email, hostel or branch (never expose password)
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
        return ResponseEntity.ok(result);
    }

    private boolean matchesMeal(MealSubmission s, String query) {
        if (containsIgnoreCase(s.getMealType(), query)) {
            return true;
        }
        if (s.getSelectedItems() != null) {
            for (String item : s.getSelectedItems()) {
                if (containsIgnoreCase(item, query)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase().contains(query);
    }
}
