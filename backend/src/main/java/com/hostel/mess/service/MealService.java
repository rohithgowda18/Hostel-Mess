package com.hostel.mess.service;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import com.hostel.mess.exception.BadRequestException;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.hostel.mess.dto.MealResponse;
import com.hostel.mess.model.MealPhoto;
import com.hostel.mess.model.MealSubmission;
import com.hostel.mess.model.User;
import com.hostel.mess.model.WeeklyMenu;
import com.hostel.mess.repository.MealPhotoRepository;
import com.hostel.mess.repository.MealServiceRepository;
import com.hostel.mess.repository.MealSubmissionRepository;
import com.hostel.mess.repository.UserRepository;
import com.hostel.mess.repository.WeeklyMenuRepository;

@Service
public class MealService {

    @Autowired
    private WeeklyMenuRepository weeklyMenuRepository;

    @Autowired
    private MealSubmissionRepository submissionRepository;

    @Autowired
    private MealPhotoRepository mealPhotoRepository;

    @Autowired
    private MealServiceRepository mealServiceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private GridFsTemplate gridFsTemplate;

    @Autowired(required = false)
    private WebSocketEventService wsService;

    @Value("${app.disable-time-restrictions:false}")
    private boolean disableTimeRestrictions;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final String UPLOAD_DIR = "uploads/student-photos/";
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private static final ConcurrentHashMap<String, ConcurrentHashMap<String, String>> VERIFICATION_VOTES = new ConcurrentHashMap<>();

    // Time windows for each meal type
    // Breakfast: 07:30 – 09:30
    // Lunch:     12:30 – 14:30
    // Snacks:    16:30 – 17:30
    // Dinner:    19:30 – 21:30
    public static class TimeWindow {
        public final LocalTime start;
        public final LocalTime end;
        public final String name;

        TimeWindow(LocalTime start, LocalTime end, String name) {
            this.start = start;
            this.end = end;
            this.name = name;
        }
    }

    private static final Map<String, TimeWindow> MEAL_TIME_WINDOWS = new LinkedHashMap<>();
    static {
        MEAL_TIME_WINDOWS.put("BREAKFAST", new TimeWindow(LocalTime.of(7, 30), LocalTime.of(9, 30), "Breakfast"));
        MEAL_TIME_WINDOWS.put("LUNCH", new TimeWindow(LocalTime.of(12, 30), LocalTime.of(14, 30), "Lunch"));
        MEAL_TIME_WINDOWS.put("SNACKS", new TimeWindow(LocalTime.of(16, 30), LocalTime.of(17, 30), "Snacks"));
        MEAL_TIME_WINDOWS.put("DINNER", new TimeWindow(LocalTime.of(19, 30), LocalTime.of(21, 30), "Dinner"));
    }

    public boolean isWithinTimeWindow(String mealType) {
        if (disableTimeRestrictions) {
            return true;
        }
        if (mealType == null) {
            return false;
        }
        TimeWindow window = MEAL_TIME_WINDOWS.get(mealType.toUpperCase());
        if (window == null) {
            return false;
        }
        LocalTime now = LocalTime.now(IST);
        return !now.isBefore(window.start) && now.isBefore(window.end);
    }

    public String getActiveMealTypeAt(LocalTime time) {
        if (time == null) return null;
        for (Map.Entry<String, TimeWindow> entry : MEAL_TIME_WINDOWS.entrySet()) {
            TimeWindow w = entry.getValue();
            if (!time.isBefore(w.start) && time.isBefore(w.end)) {
                return entry.getKey();
            }
        }
        return null;
    }

    public String getCurrentActiveMealType() {
        if (disableTimeRestrictions) {
            return detectMealType();
        }
        return getActiveMealTypeAt(LocalTime.now(IST));
    }

    public void validateActiveMealAt(String requestedMealType, String actionName, LocalTime time) {
        if (disableTimeRestrictions) {
            return;
        }
        String active = getActiveMealTypeAt(time);
        String action = (actionName != null && !actionName.isEmpty()) ? actionName : "reporting";

        if (active == null) {
            throw new BadRequestException("No meal is currently being served. " + capitalize(action) + " is closed.");
        }

        if (requestedMealType != null && !requestedMealType.trim().isEmpty()) {
            String reqUpper = requestedMealType.trim().toUpperCase();
            if (!reqUpper.equals(active)) {
                String reqCap = capitalize(reqUpper);
                String activeCap = capitalize(active);
                throw new BadRequestException(reqCap + " " + action + " is closed. " + activeCap + " is currently being served.");
            }
        }
    }

    public void validateActiveMeal(String requestedMealType, String actionName) {
        validateActiveMealAt(requestedMealType, actionName, LocalTime.now(IST));
    }

    private String capitalize(String text) {
        if (text == null || text.isEmpty()) return "";
        return text.substring(0, 1).toUpperCase() + text.substring(1).toLowerCase();
    }

    public Map<String, Object> getActiveSlotInfo() {
        ZonedDateTime now = ZonedDateTime.now(IST);
        LocalTime localNow = now.toLocalTime();
        String activeKey = getCurrentActiveMealType();
        boolean isActive = (activeKey != null);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("serverTime", now.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        result.put("serverTimeMillis", now.toInstant().toEpochMilli());
        result.put("serverDate", now.toLocalDate().toString());
        result.put("serverTimeString", localNow.format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        result.put("isActive", isActive);
        result.put("activeSlot", activeKey);

        if (isActive) {
            TimeWindow activeWindow = MEAL_TIME_WINDOWS.get(activeKey);
            result.put("slotName", activeWindow.name);
            result.put("startTime", activeWindow.start.toString());
            result.put("endTime", activeWindow.end.toString());
            result.put("time", String.format("%s – %s", activeWindow.start, activeWindow.end));

            ZonedDateTime endZdt = now.with(activeWindow.end).withSecond(0).withNano(0);
            long endMillis = endZdt.toInstant().toEpochMilli();
            long remainingSeconds = Math.max(0, Duration.between(now, endZdt).getSeconds());
            result.put("endTimeMillis", endMillis);
            result.put("remainingSeconds", remainingSeconds);
        } else {
            result.put("slotName", null);
            result.put("startTime", null);
            result.put("endTime", null);
            result.put("time", null);
            result.put("endTimeMillis", null);
            result.put("remainingSeconds", 0L);
        }

        // Determine next upcoming slot
        Map<String, Object> nextSlot = new LinkedHashMap<>();
        String nextKey;
        if (localNow.isBefore(LocalTime.of(7, 30))) {
            nextKey = "BREAKFAST";
        } else if (localNow.isBefore(LocalTime.of(12, 30))) {
            nextKey = "LUNCH";
        } else if (localNow.isBefore(LocalTime.of(16, 30))) {
            nextKey = "SNACKS";
        } else if (localNow.isBefore(LocalTime.of(19, 30))) {
            nextKey = "DINNER";
        } else {
            nextKey = "BREAKFAST"; // Tomorrow's breakfast
        }

        TimeWindow nextWindow = MEAL_TIME_WINDOWS.get(nextKey);
        nextSlot.put("key", nextKey);
        nextSlot.put("name", nextWindow.name);
        nextSlot.put("startTime", nextWindow.start.toString());
        nextSlot.put("endTime", nextWindow.end.toString());
        nextSlot.put("time", String.format("%s – %s", nextWindow.start, nextWindow.end));
        result.put("nextSlot", nextSlot);

        return result;
    }

    public String getTimeWindowMessage(String mealType) {
        TimeWindow window = MEAL_TIME_WINDOWS.get(mealType.toUpperCase());
        if (window == null) {
            return "Invalid meal type";
        }
        if (isWithinTimeWindow(mealType)) {
            return String.format("Update window open until %s", window.end.toString());
        } else {
            return String.format("Update window: %s - %s", window.start.toString(), window.end.toString());
        }
    }

    public MealResponse getTodayMeal(String mealType) {
        String today = LocalDate.now(IST).format(DATE_FORMATTER);
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

    public Map<String, Object> processStudentSubmission(User user, String mealType, String date, List<String> items, String photoUrl) {
        validateActiveMeal(mealType, "reporting");
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
            MealPhoto photo = new MealPhoto();
            photo.setMealType(mType);
            photo.setDate(date);
            photo.setImageUrls(List.of(photoUrl));
            photo.setDescription("Reported by " + (user.getEmail() != null ? user.getEmail().split("@")[0] : "Student") + " for " + mType);
            photo.setUploadedAt(new Date());
            mealPhotoRepository.save(photo);
        }

        Map<String, Object> consensus = getMealConsensus(mType, date);
        if (wsService != null) {
            wsService.broadcastAppEvent("MEAL_CONSENSUS_UPDATED", consensus);
        }

        String msg = isFirstReporterForMeal ? "You are the FIRST reporter! +" + pointsEarned + " Pts awarded!" : "Meal report submitted! +" + pointsEarned + " Pts awarded!";

        return Map.of(
                "success", true,
                "message", msg,
                "pointsEarned", pointsEarned,
                "consensus", consensus
        );
    }

    public Map<String, Object> processVerification(String userEmail, String mealType, String date, String foodItem, String vote) {
        String mType = mealType.toUpperCase();
        String itemKey = date + ":" + mType + ":" + foodItem.trim().toLowerCase();
        VERIFICATION_VOTES.computeIfAbsent(itemKey, k -> new ConcurrentHashMap<>()).put(userEmail, vote.toUpperCase());

        Map<String, Object> consensus = getMealConsensus(mType, date);
        if (wsService != null) {
            wsService.broadcastAppEvent("MEAL_VERIFICATION_UPDATED", consensus);
        }
        return consensus;
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

            String itemKey = date + ":" + mType + ":" + item.trim().toLowerCase();
            ConcurrentHashMap<String, String> userVotes = VERIFICATION_VOTES.get(itemKey);
            int yesVotes = 0;
            int noVotes = 0;
            if (userVotes != null) {
                for (String v : userVotes.values()) {
                    if ("YES".equalsIgnoreCase(v)) yesVotes++;
                    else if ("NO".equalsIgnoreCase(v)) noVotes++;
                }
            }
            itemData.put("yesVotes", yesVotes);
            itemData.put("noVotes", noVotes);

            String status = "Awaiting verification";
            if (!isWithinTimeWindow(mType)) {
                status = "Closed/expired";
            } else if (yesVotes >= 3 || votes >= 3) {
                status = "Verified";
            } else if (yesVotes >= 1 && noVotes >= 1) {
                status = "Conflicting reports";
            } else if (yesVotes >= 1 || votes >= 1) {
                status = "Community confirmed";
            }
            itemData.put("status", status);
            itemData.put("verified", "Verified".equals(status) || votes >= 2);
            itemConfidenceList.add(itemData);
        });

        itemConfidenceList.sort((a, b) -> Integer.compare((Integer) b.get("confidence"), (Integer) a.get("confidence")));

        String confidenceRating = "LOW";
        if (totalSubmissions >= 5) {
            confidenceRating = "HIGH";
        } else if (totalSubmissions >= 2) {
            confidenceRating = "MEDIUM";
        }

        // Resolve planned menu from weekly menu repository
        List<String> expectedItems = List.of("Idli", "Vada", "Sambar", "Chutney", "Tea");
        List<WeeklyMenu> allMenus = weeklyMenuRepository.findAll();
        if (!allMenus.isEmpty()) {
            WeeklyMenu menu = allMenus.get(0);
            String dayOfWeek = LocalDate.now(IST).getDayOfWeek().name();
            Map<String, List<String>> dayMenu = switch (dayOfWeek) {
                case "TUESDAY" -> menu.getTuesday();
                case "WEDNESDAY" -> menu.getWednesday();
                case "THURSDAY" -> menu.getThursday();
                case "FRIDAY" -> menu.getFriday();
                case "SATURDAY" -> menu.getSaturday();
                case "SUNDAY" -> menu.getSunday();
                default -> menu.getMonday();
            };
            if (dayMenu != null && dayMenu.containsKey(mType)) {
                expectedItems = dayMenu.get(mType);
            }
        }

        boolean menuChanged = false;
        if (totalSubmissions > 0 && !itemConfidenceList.isEmpty()) {
            List<String> topCommunityItems = itemConfidenceList.stream()
                    .filter(i -> (Integer) i.get("confidence") >= 40)
                    .map(i -> (String) i.get("name"))
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

    // ==========================================
    // WEEKLY MENU
    // ==========================================

    public WeeklyMenu getWeeklyMenu(String weekStartDate) {
        if (weekStartDate != null) {
            Optional<WeeklyMenu> menuOpt = weeklyMenuRepository.findByWeekStartDate(weekStartDate);
            if (menuOpt.isPresent()) {
                return menuOpt.get();
            }
        }
        List<WeeklyMenu> allMenus = weeklyMenuRepository.findAll();
        if (!allMenus.isEmpty()) {
            return allMenus.get(0);
        }
        return seedDefaultWeeklyMenu(weekStartDate);
    }

    public WeeklyMenu saveWeeklyMenu(WeeklyMenu weeklyMenu) {
        if (weeklyMenu.getWeekStartDate() == null) {
            throw new IllegalArgumentException("weekStartDate is required");
        }
        Optional<WeeklyMenu> existing = weeklyMenuRepository.findByWeekStartDate(weeklyMenu.getWeekStartDate());
        existing.ifPresent(menu -> weeklyMenu.setId(menu.getId()));
        return weeklyMenuRepository.save(weeklyMenu);
    }

    private WeeklyMenu seedDefaultWeeklyMenu(String weekStartDate) {
        String startDate = weekStartDate != null ? weekStartDate : LocalDate.now(IST).toString();
        WeeklyMenu menu = new WeeklyMenu();
        menu.setWeekStartDate(startDate);

        Map<String, List<String>> monday = new HashMap<>();
        monday.put("BREAKFAST", List.of("Idli", "Vada", "Sambar", "Coconut Chutney", "Tea/Coffee"));
        monday.put("LUNCH", List.of("Steamed Rice", "Dal Tadka", "Paneer Curry", "Roti", "Curd"));
        monday.put("SNACKS", List.of("Veg Pakoda", "Green Chutney", "Tea/Coffee"));
        monday.put("DINNER", List.of("Jeera Rice", "Aloo Gobi", "Dal", "Roti", "Gulab Jamun"));
        menu.setMonday(monday);

        Map<String, List<String>> tuesday = new HashMap<>();
        tuesday.put("BREAKFAST", List.of("Poori", "Saagu", "Kesari Bath", "Tea/Coffee"));
        tuesday.put("LUNCH", List.of("Rice", "Rasam", "Chole Masala", "Bhature", "Salad"));
        tuesday.put("SNACKS", List.of("Samosa", "Sweet Chutney", "Tea/Coffee"));
        tuesday.put("DINNER", List.of("Fried Rice", "Veg Manchurian", "Roti", "Dal", "Banana"));
        menu.setTuesday(tuesday);

        menu.setWednesday(monday);
        menu.setThursday(tuesday);
        menu.setFriday(monday);
        menu.setSaturday(tuesday);
        menu.setSunday(monday);

        return weeklyMenuRepository.save(menu);
    }

    // ==========================================
    // MEAL SERVICE LIFECYCLE
    // ==========================================

    public List<com.hostel.mess.model.MealService> getOrInitServicesForDate(String date) {
        List<com.hostel.mess.model.MealService> existing = mealServiceRepository.findByDate(date);
        if (existing.size() >= 4) {
            return existing;
        }

        Map<String, String[]> schedule = new LinkedHashMap<>();
        schedule.put("BREAKFAST", new String[]{"07:30", "09:30"});
        schedule.put("LUNCH", new String[]{"12:30", "14:30"});
        schedule.put("SNACKS", new String[]{"16:30", "17:30"});
        schedule.put("DINNER", new String[]{"19:30", "21:30"});

        Set<String> existingTypes = new HashSet<>();
        for (com.hostel.mess.model.MealService s : existing) {
            existingTypes.add(s.getMealType().toUpperCase());
        }

        LocalTime now = LocalTime.now(IST);
        boolean isToday = LocalDate.now(IST).toString().equals(date);

        List<com.hostel.mess.model.MealService> created = new ArrayList<>(existing);
        for (Map.Entry<String, String[]> entry : schedule.entrySet()) {
            String type = entry.getKey();
            if (!existingTypes.contains(type)) {
                String start = entry.getValue()[0];
                String end = entry.getValue()[1];

                String initialStatus = "SCHEDULED";
                if (isToday) {
                    LocalTime sTime = LocalTime.parse(start);
                    LocalTime eTime = LocalTime.parse(end);
                    if (!now.isBefore(sTime) && !now.isAfter(eTime)) {
                        initialStatus = "OPEN";
                    } else if (now.isAfter(eTime)) {
                        initialStatus = "COMPLETED";
                    }
                }

                com.hostel.mess.model.MealService ms = new com.hostel.mess.model.MealService(date, type, start, end, initialStatus);
                ms = mealServiceRepository.save(ms);
                created.add(ms);
            }
        }
        return created;
    }

    public com.hostel.mess.model.MealService getCurrentOrNextService() {
        String today = LocalDate.now(IST).toString();
        List<com.hostel.mess.model.MealService> services = getOrInitServicesForDate(today);
        LocalTime now = LocalTime.now(IST);

        for (com.hostel.mess.model.MealService s : services) {
            LocalTime sTime = LocalTime.parse(s.getStartTime());
            LocalTime eTime = LocalTime.parse(s.getEndTime());
            if (!now.isBefore(sTime) && now.isBefore(eTime)) {
                if (!"OPEN".equals(s.getStatus())) {
                    s.setStatus("OPEN");
                    mealServiceRepository.save(s);
                }
                return s;
            }
        }

        for (com.hostel.mess.model.MealService s : services) {
            LocalTime sTime = LocalTime.parse(s.getStartTime());
            if (now.isBefore(sTime)) {
                return s;
            }
        }
        return services.isEmpty() ? null : services.get(0);
    }

    public com.hostel.mess.model.MealService updateMealServiceStatus(String id, String status) {
        com.hostel.mess.model.MealService service = mealServiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MealService not found: " + id));
        service.setStatus(status.toUpperCase());
        return mealServiceRepository.save(service);
    }

    // ==========================================
    // MEAL PHOTO EVIDENCE & MEAL TRANSITION CLEANUP
    // ==========================================

    public MealPhoto uploadMealPhoto(List<MultipartFile> images, String description, String mealTypeParam, Principal principal) throws Exception {
        if (images == null || images.isEmpty() || images.stream().allMatch(MultipartFile::isEmpty)) {
            throw new IllegalArgumentException("At least one image is required");
        }

        // Validate active meal strictly from current server time (Asia/Kolkata)
        String activeMeal = getCurrentActiveMealType();
        if (activeMeal == null) {
            throw new BadRequestException("No meal is currently being served. Photo upload is closed.");
        }

        if (mealTypeParam != null && !mealTypeParam.trim().isEmpty()) {
            if (!mealTypeParam.trim().equalsIgnoreCase(activeMeal)) {
                throw new BadRequestException("Current meal is " + activeMeal + ". Cannot upload photo for " + mealTypeParam + ".");
            }
        }

        // Validate each non-empty file format and size
        for (MultipartFile image : images) {
            if (image.isEmpty()) continue;
            String contentType = image.getContentType();
            if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
                throw new BadRequestException("Invalid image format. Allowed formats: JPEG, PNG, WEBP.");
            }
            if (image.getSize() > 5 * 1024 * 1024) {
                throw new BadRequestException("Image file size exceeds maximum limit of 5MB.");
            }
        }

        String uploaderEmail = principal != null ? principal.getName() : "student@hostel.app";
        User user = userRepository.findById(uploaderEmail).orElse(null);
        String uploaderName = (user != null && user.getEmail() != null) ? user.getEmail().split("@")[0] : uploaderEmail.split("@")[0];

        String mealType = activeMeal;
        String today = LocalDate.now(IST).toString();
        List<String> imageUrls = new ArrayList<>();
        String gridFsFileId = null;

        for (MultipartFile image : images) {
            if (image.isEmpty()) continue;
            String contentType = image.getContentType();
            if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
                contentType = "image/jpeg";
            }

            if (gridFsTemplate != null) {
                try {
                    ObjectId fileId = gridFsTemplate.store(
                            image.getInputStream(),
                            image.getOriginalFilename(),
                            contentType
                    );
                    gridFsFileId = fileId.toString();
                    imageUrls.add("/api/student-photos/" + gridFsFileId + "/image");
                } catch (Exception ignored) {}
            }

            if (imageUrls.isEmpty()) {
                Path dir = Paths.get(UPLOAD_DIR);
                if (!Files.exists(dir)) Files.createDirectories(dir);
                String filename = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 6) + ".jpg";
                Path target = dir.resolve(filename);
                image.transferTo(target);
                imageUrls.add("/" + UPLOAD_DIR + filename);
            }
        }

        String caption = (description != null && !description.trim().isEmpty()) ? description.trim() : null;

        MealPhoto photo = new MealPhoto();
        photo.setUserEmail(uploaderEmail);
        photo.setUploadedBy(uploaderName);
        photo.setMealType(mealType);
        photo.setDate(today);
        photo.setImageUrls(imageUrls);
        photo.setGridFsFileId(gridFsFileId);
        photo.setCaption(caption);
        photo.setDescription(caption);
        photo.setUploadedAt(new Date());

        MealPhoto saved = mealPhotoRepository.save(photo);
        if (wsService != null) {
            wsService.broadcastAppEvent("MEAL_PHOTO_ADDED", saved);
        }
        return saved;
    }

    public List<MealPhoto> getCurrentMealPhotos() {
        // Run cleanup of previous meal photos if a transition occurred
        cleanupPreviousMealPhotos();

        String activeMeal = getCurrentActiveMealType();
        if (activeMeal == null) {
            return List.of();
        }
        String today = LocalDate.now(IST).toString();
        List<MealPhoto> list = mealPhotoRepository.findByDateAndMealTypeOrderByUploadedAtDesc(today, activeMeal);
        return list.size() > 100 ? list.subList(0, 100) : list;
    }

    public List<MealPhoto> getTodayPhotos() {
        cleanupPreviousMealPhotos();
        String today = LocalDate.now(IST).toString();
        List<MealPhoto> list = mealPhotoRepository.findByDate(today);
        return list.size() > 100 ? list.subList(list.size() - 100, list.size()) : list;
    }

    public synchronized int cleanupPreviousMealPhotos() {
        LocalTime now = LocalTime.now(IST);
        LocalDate todayDate = LocalDate.now(IST);
        String today = todayDate.toString();

        List<MealPhoto> allPhotos = mealPhotoRepository.findAll();
        if (allPhotos.isEmpty()) {
            return 0;
        }

        List<MealPhoto> toDelete = new ArrayList<>();

        for (MealPhoto p : allPhotos) {
            String pDate = p.getDate();
            String pType = (p.getMealType() != null) ? p.getMealType().toUpperCase() : "";

            // Photos before today:
            if (pDate == null || !pDate.equals(today)) {
                // If before 07:30 AM today, keep yesterday's DINNER until breakfast begins at 07:30
                if (now.isBefore(LocalTime.of(7, 30))
                        && pDate != null
                        && pDate.equals(todayDate.minusDays(1).toString())
                        && "DINNER".equals(pType)) {
                    continue;
                }
                toDelete.add(p);
                continue;
            }

            // Photos from today:
            if (now.isBefore(LocalTime.of(7, 30))) {
                // Early morning before breakfast starts
            } else if (now.isBefore(LocalTime.of(12, 30))) {
                // 07:30 to 12:30: Breakfast period. Breakfast photos remain.
            } else if (now.isBefore(LocalTime.of(16, 30))) {
                // 12:30 onwards: Lunch has begun. Delete Breakfast photos!
                if ("BREAKFAST".equals(pType)) {
                    toDelete.add(p);
                }
            } else if (now.isBefore(LocalTime.of(19, 30))) {
                // 16:30 onwards: Snacks has begun. Delete Lunch and Breakfast photos!
                if ("LUNCH".equals(pType) || "BREAKFAST".equals(pType)) {
                    toDelete.add(p);
                }
            } else {
                // 19:30 onwards: Dinner has begun. Delete Snacks, Lunch, and Breakfast photos!
                if ("SNACKS".equals(pType) || "LUNCH".equals(pType) || "BREAKFAST".equals(pType)) {
                    toDelete.add(p);
                }
            }
        }

        if (!toDelete.isEmpty()) {
            for (MealPhoto p : toDelete) {
                deletePhotoResources(p);
            }
            mealPhotoRepository.deleteAll(toDelete);
        }
        return toDelete.size();
    }

    private void deletePhotoResources(MealPhoto photo) {
        if (photo.getGridFsFileId() != null && gridFsTemplate != null) {
            try {
                gridFsTemplate.delete(new Query(Criteria.where("_id").is(new ObjectId(photo.getGridFsFileId()))));
            } catch (Exception ignored) {}
        }
        if (photo.getImageUrls() != null) {
            for (String url : photo.getImageUrls()) {
                if (url != null && url.startsWith("/" + UPLOAD_DIR)) {
                    try {
                        File f = new File(url.substring(1));
                        if (f.exists()) f.delete();
                    } catch (Exception ignored) {}
                }
            }
        }
    }

    public ResponseEntity<?> streamMealPhotoImage(String id) {
        MealPhoto photo = mealPhotoRepository.findById(id).orElse(null);
        String gridId = (photo != null && photo.getGridFsFileId() != null) ? photo.getGridFsFileId() : id;

        if (gridFsTemplate != null) {
            try {
                com.mongodb.client.gridfs.model.GridFSFile gridFile = gridFsTemplate.findOne(
                        new Query(Criteria.where("_id").is(new ObjectId(gridId)))
                );
                if (gridFile != null) {
                    GridFsResource resource = gridFsTemplate.getResource(gridFile);
                    if (resource != null && resource.exists()) {
                        String ct = (gridFile.getMetadata() != null && gridFile.getMetadata().getString("_contentType") != null)
                                ? gridFile.getMetadata().getString("_contentType")
                                : "image/jpeg";
                        return ResponseEntity.ok()
                                .contentType(MediaType.parseMediaType(ct))
                                .body(new InputStreamResource(resource.getInputStream()));
                    }
                }
            } catch (Exception ignored) {}
        }

        if (photo != null && photo.getImageUrls() != null && !photo.getImageUrls().isEmpty()) {
            for (String url : photo.getImageUrls()) {
                if (url.startsWith("/" + UPLOAD_DIR)) {
                    File f = new File(url.substring(1));
                    if (f.exists()) {
                        try {
                            byte[] bytes = Files.readAllBytes(f.toPath());
                            return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(bytes);
                        } catch (Exception ignored) {}
                    }
                }
            }
        }
        return ResponseEntity.notFound().build();
    }

    // ==========================================
    // FAVORITE FOODS
    // ==========================================

    public List<String> getFavorites(String userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        return user.getFavoriteFoods() != null ? user.getFavoriteFoods() : List.of();
    }

    public List<String> saveFavorites(String userId, List<String> items) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setFavoriteFoods(items != null ? items : new ArrayList<>());
        userRepository.save(user);
        return user.getFavoriteFoods();
    }

    private String detectMealType() {
        LocalTime now = LocalTime.now(IST);
        if (now.isAfter(LocalTime.of(7, 0)) && now.isBefore(LocalTime.of(10, 1))) return "BREAKFAST";
        if (now.isAfter(LocalTime.of(12, 0)) && now.isBefore(LocalTime.of(15, 1))) return "LUNCH";
        if (now.isAfter(LocalTime.of(16, 0)) && now.isBefore(LocalTime.of(18, 1))) return "SNACKS";
        if (now.isAfter(LocalTime.of(19, 0)) && now.isBefore(LocalTime.of(22, 1))) return "DINNER";
        return "LUNCH";
    }
}
