package com.hostel.mess.foodphoto;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class FoodPhotoScheduler {
    @Autowired
    private FoodPhotoService foodPhotoService;

    // Run every hour
    @Scheduled(cron = "0 0 * * * *")
    public void cleanupExpiredPhotos() {
        foodPhotoService.deleteExpiredPhotos();
    }
}
