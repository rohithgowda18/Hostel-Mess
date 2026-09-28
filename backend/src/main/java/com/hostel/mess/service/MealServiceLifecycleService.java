package com.hostel.mess.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.hostel.mess.model.MealService;
import com.hostel.mess.repository.MealServiceRepository;

@Service
public class MealServiceLifecycleService {

    @Autowired
    private MealServiceRepository mealServiceRepository;

    @Autowired(required = false)
    private WebSocketEventService webSocketEventService;

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    /**
     * Ensures all 4 standard services exist for a given date.
     */
    public List<MealService> getOrInitServicesForDate(String date) {
        List<MealService> existing = mealServiceRepository.findByDate(date);
        if (existing.size() >= 4) {
            return existing;
        }

        Map<String, String[]> schedule = new LinkedHashMap<>();
        schedule.put("BREAKFAST", new String[]{"07:30", "09:30"});
        schedule.put("LUNCH", new String[]{"12:30", "14:30"});
        schedule.put("SNACKS", new String[]{"16:30", "17:30"});
        schedule.put("DINNER", new String[]{"19:30", "21:30"});

        Set<String> existingTypes = new HashSet<>();
        for (MealService s : existing) {
            existingTypes.add(s.getMealType().toUpperCase());
        }

        LocalTime now = LocalTime.now(IST);
        boolean isToday = LocalDate.now(IST).toString().equals(date);

        List<MealService> created = new ArrayList<>(existing);
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

                MealService ms = new MealService(date, type, start, end, initialStatus);
                ms = mealServiceRepository.save(ms);
                created.add(ms);
            }
        }

        return created;
    }

    /**
     * Identifies the current active or next upcoming meal service.
     */
    public MealService getCurrentOrNextService() {
        String today = LocalDate.now(IST).toString();
        List<MealService> services = getOrInitServicesForDate(today);

        LocalTime now = LocalTime.now(IST);

        // First look for OPEN service
        for (MealService s : services) {
            LocalTime sTime = LocalTime.parse(s.getStartTime());
            LocalTime eTime = LocalTime.parse(s.getEndTime());
            if (!now.isBefore(sTime) && !now.isAfter(eTime)) {
                if (!"OPEN".equals(s.getStatus())) {
                    s.setStatus("OPEN");
                    mealServiceRepository.save(s);
                }
                return s;
            }
        }

        // Otherwise find next scheduled
        for (MealService s : services) {
            LocalTime sTime = LocalTime.parse(s.getStartTime());
            if (now.isBefore(sTime)) {
                return s;
            }
        }

        // Wrap around to breakfast
        return services.isEmpty() ? null : services.get(0);
    }

    public MealService updateStatus(String id, String status) {
        MealService ms = mealServiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MealService not found: " + id));
        ms.setStatus(status.toUpperCase());
        ms.setUpdatedAt(System.currentTimeMillis());
        MealService saved = mealServiceRepository.save(ms);

        if (webSocketEventService != null) {
            webSocketEventService.broadcastAppEvent("MEAL_STATUS_UPDATED", saved);
        }
        return saved;
    }

    public void incrementActualAttendance(String date, String mealType) {
        mealServiceRepository.findByDateAndMealType(date, mealType.toUpperCase()).ifPresent(ms -> {
            ms.setActualAttendance(ms.getActualAttendance() + 1);
            ms.setUpdatedAt(System.currentTimeMillis());
            mealServiceRepository.save(ms);
            if (webSocketEventService != null) {
                webSocketEventService.broadcastAppEvent("CROWD_UPDATED", Map.of(
                        "mealServiceId", ms.getId(),
                        "actualAttendance", ms.getActualAttendance(),
                        "mealType", ms.getMealType()
                ));
            }
        });
    }

    public void incrementExpectedAttendance(String date, String mealType, boolean expected) {
        mealServiceRepository.findByDateAndMealType(date, mealType.toUpperCase()).ifPresent(ms -> {
            int current = ms.getExpectedAttendance() != null ? ms.getExpectedAttendance() : 0;
            if (expected) {
                ms.setExpectedAttendance(current + 1);
            } else if (current > 0) {
                ms.setExpectedAttendance(current - 1);
            }
            mealServiceRepository.save(ms);
        });
    }
}
