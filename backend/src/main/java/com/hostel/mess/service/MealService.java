package com.hostel.mess.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hostel.mess.dto.MealRequest;
import com.hostel.mess.dto.MealResponse;
import com.hostel.mess.model.WeeklyMenu;
import com.hostel.mess.model.MealAttendance;
import com.hostel.mess.model.FoodRating;
import com.hostel.mess.model.MealSubmission;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.WeeklyMenuRepository;
import com.hostel.mess.repository.MealAttendanceRepository;
import com.hostel.mess.repository.FoodRatingRepository;
import com.hostel.mess.repository.MealSubmissionRepository;
import com.hostel.mess.repository.UserRepository;

@Service
public class MealService {

    @Autowired
    private WeeklyMenuRepository weeklyMenuRepository;

    @Autowired
    private MealAttendanceRepository attendanceRepository;

    @Autowired
    private FoodRatingRepository ratingRepository;

    @Autowired
    private MealSubmissionRepository submissionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WebSocketEventService wsService;

    @Autowired
    private com.hostel.mess.repository.MealPhotoRepository mealPhotoRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // Time windows for each meal type
    private static final Map<String, TimeWindow> MEAL_TIME_WINDOWS = Map.of(
            "BREAKFAST", new TimeWindow(LocalTime.of(7, 0), LocalTime.of(9, 30)),
            "LUNCH", new TimeWindow(LocalTime.of(12, 0), LocalTime.of(14, 30)),
            "SNACKS", new TimeWindow(LocalTime.of(16, 30), LocalTime.of(18, 0)),
            "DINNER", new TimeWindow(LocalTime.of(19, 30), LocalTime.of(21, 30))
    );

    // Set to true to disable time restrictions (for testing)
    private static final boolean DISABLE_TIME_RESTRICTIONS = true;

    private static class TimeWindow {
        final LocalTime start;
        final LocalTime end;

        TimeWindow(LocalTime start, LocalTime end) {
            this.start = start;
            this.end = end;
        }
    }

    public boolean isWithinTimeWindow(String mealType) {
        if (DISABLE_TIME_RESTRICTIONS) return true;
        TimeWindow window = MEAL_TIME_WINDOWS.get(mealType.toUpperCase());
        if (window == null) return false;
        LocalTime now = LocalTime.now();
        return !now.isBefore(window.start) && !now.isAfter(window.end);
    }

    public String getTimeWindowMessage(String mealType) {
        TimeWindow window = MEAL_TIME_WINDOWS.get(mealType.toUpperCase());
        if (window == null) return "Invalid meal type";
        if (isWithinTimeWindow(mealType)) {
            return String.format("Update window open until %s", window.end.toString());
        } else {
            return String.format("Update window: %s - %s", window.start.toString(), window.end.toString());
        }
    }

    /**
     * Get today's meal for a specific meal type from live student consensus and official weekly menu
     */
    public MealResponse getTodayMeal(String mealType) {
        String today = LocalDate.now().format(DATE_FORMATTER);
        Map<String, Object> consensus = getMealConsensus(mealType, today);

        MealResponse response = new MealResponse();
        response.setMealType(mealType.toUpperCase());
        response.setDate(today);
        response.setUpdateWindowOpen(isWithinTimeWindow(mealType));
        response.setUpdateWindowMessage(getTimeWindowMessage(mealType));

        List<String> items = (List<String>) consensus.get("expectedItems");
        response.setItems(items != null ? items : List.of());
        response.setPostedAt(Instant.now().toString());
        response.setConfirmations((Integer) consensus.getOrDefault("totalReporters", 0));
        response.setVerificationStatus((Boolean) consensus.getOrDefault("menuChanged", false) ? "MENU_CHANGED" : "VERIFIED");

        return response;
    }

    public boolean deleteTodayMeal(String mealType) {
        return true;
    }

    public MealResponse updateMeal(MealRequest request) {
        return getTodayMeal(request.getMealType());
    }

    // Food Ratings logic
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

        wsService.broadcastAppEvent("RATINGS_UPDATED", Map.of(
            "mealType", rating.getMealType(),
            "date", rating.getDate(),
            "rating", saved
        ));

        return saved;
    }

    public List<FoodRating> getMealRatings(String mealType, String date) {
        return ratingRepository.findByMealTypeAndDate(mealType, date);
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

    public Map<String, Object> processStudentSubmission(User user, String mealType, String date, List<String> items, String photoUrl) {
        String mType = mealType.toUpperCase();
        Optional<MealSubmission> existing = submissionRepository.findByStudentEmailAndMealTypeAndDate(user.getEmail(), mType, date);
        boolean isFirstReporterForMeal = submissionRepository.findByMealTypeAndDate(mType, date).isEmpty();
        
        MealSubmission sub;
        int pointsEarned = 10;

        if (existing.isPresent()) {
            sub = existing.get();
            sub.setSelectedItems(items);
            if (photoUrl != null && !photoUrl.isEmpty()) {
                sub.setPhotoUrl(photoUrl);
            }
        } else {
            sub = new MealSubmission(user.getId(), user.getEmail(), mType, date, items, photoUrl);
            
            if (isFirstReporterForMeal) {
                pointsEarned += 20;
                if (!user.getBadges().contains("Meal Reporter")) {
                    user.getBadges().add("Meal Reporter");
                }
            }
            if (photoUrl != null && !photoUrl.isEmpty()) {
                pointsEarned += 5;
                if (!user.getBadges().contains("Food Explorer")) {
                    user.getBadges().add("Food Explorer");
                }
            }
            if (!user.getBadges().contains("Community Helper")) {
                user.getBadges().add("Community Helper");
            }
            user.addPoints(pointsEarned);
            userRepository.save(user);
        }
        submissionRepository.save(sub);

        if (photoUrl != null && !photoUrl.isEmpty()) {
            com.hostel.mess.model.MealPhoto photo = new com.hostel.mess.model.MealPhoto();
            photo.setMealType(mType);
            photo.setDate(date);
            photo.setImageUrls(List.of(photoUrl));
            photo.setDescription("Reported by " + (user.getEmail() != null ? user.getEmail().split("@")[0] : "Student") + " for " + mType);
            photo.setUploadedAt(new Date());
            mealPhotoRepository.save(photo);
        }

        Map<String, Object> consensus = getMealConsensus(mType, date);
        wsService.broadcastAppEvent("MEAL_CONSENSUS_UPDATED", consensus);

        String msg = isFirstReporterForMeal ? "You are the FIRST reporter! +" + pointsEarned + " Pts awarded!" : "Meal report submitted! +" + pointsEarned + " Pts awarded!";

        return Map.of(
            "success", true,
            "message", msg,
            "pointsEarned", pointsEarned,
            "consensus", consensus
        );
    }

    public Map<String, Object> getMealConsensus(String mealType, String date) {
        String mType = mealType.toUpperCase();
        List<MealSubmission> submissions = submissionRepository.findByMealTypeAndDate(mType, date);
        int totalSubmissions = submissions.size();

        Map<String, Integer> itemVotes = new HashMap<>();
        List<String> photos = new ArrayList<>();

        for (MealSubmission s : submissions) {
            if (s.getSelectedItems() != null) {
                for (String item : s.getSelectedItems()) {
                    itemVotes.put(item, itemVotes.getOrDefault(item, 0) + 1);
                }
            }
            if (s.getPhotoUrl() != null && !s.getPhotoUrl().isEmpty()) {
                photos.add(s.getPhotoUrl());
            }
        }

        List<Map<String, Object>> itemConfidenceList = new ArrayList<>();
        itemVotes.forEach((item, votes) -> {
            int confidence = totalSubmissions > 0 ? (int) Math.round(((double) votes / totalSubmissions) * 100) : 0;
            Map<String, Object> itemData = new HashMap<>();
            itemData.put("name", item);
            itemData.put("votes", votes);
            itemData.put("confidence", confidence);
            itemData.put("verified", votes >= 2);
            itemConfidenceList.add(itemData);
        });

        itemConfidenceList.sort((a, b) -> Integer.compare((Integer) b.get("confidence"), (Integer) a.get("confidence")));

        String confidenceRating = "LOW";
        if (totalSubmissions >= 5) {
            confidenceRating = "HIGH";
        } else if (totalSubmissions >= 2) {
            confidenceRating = "MEDIUM";
        }

        List<String> expectedItems = List.of("Idli", "Vada", "Sambar", "Chutney", "Tea");
        List<WeeklyMenu> allMenus = weeklyMenuRepository.findAll();
        if (!allMenus.isEmpty()) {
            WeeklyMenu menu = allMenus.get(0);
            Map<String, List<String>> dayMenu = menu.getMonday();
            if (dayMenu != null && dayMenu.containsKey(mType)) {
                expectedItems = dayMenu.get(mType);
            }
        }

        boolean menuChanged = false;
        if (totalSubmissions > 0 && !itemConfidenceList.isEmpty()) {
            List<String> topCommunityItems = itemConfidenceList.stream()
                .filter(i -> (Integer)i.get("confidence") >= 40)
                .map(i -> (String)i.get("name"))
                .toList();
            if (!topCommunityItems.isEmpty()) {
                Set<String> expSet = new HashSet<>(expectedItems);
                Set<String> comSet = new HashSet<>(topCommunityItems);
                if (!expSet.equals(comSet)) {
                    menuChanged = true;
                }
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("mealType", mType);
        response.put("date", date);
        response.put("totalReporters", totalSubmissions);
        response.put("confidenceRating", confidenceRating);
        response.put("menuChanged", menuChanged);
        response.put("expectedItems", expectedItems);
        response.put("items", itemConfidenceList);
        response.put("photos", photos);

        return response;
    }
}
