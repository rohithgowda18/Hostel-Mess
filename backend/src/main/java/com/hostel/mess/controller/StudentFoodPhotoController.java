package com.hostel.mess.controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.hostel.mess.model.StudentFoodPhoto;
import com.hostel.mess.service.StudentFoodPhotoService;

@RestController
@RequestMapping("/api/student-photos")
public class StudentFoodPhotoController {
    @Autowired
    private StudentFoodPhotoService service;

    private static final String UPLOAD_DIR = "uploads/student-photos/";

    @PostMapping("/upload")
    public ResponseEntity<?> uploadPhoto(@RequestParam("images") List<MultipartFile> images,
                                         @RequestParam(value = "description", required = false) String description) {
        if (images == null || images.isEmpty() || images.stream().allMatch(MultipartFile::isEmpty)) {
            return ResponseEntity.badRequest().body("At least one image is required");
        }
        try {
            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) dir.mkdirs();
            List<String> imageUrls = new java.util.ArrayList<>();
            for (MultipartFile image : images) {
                if (image.isEmpty()) continue;
                String filename = UUID.randomUUID() + "_" + StringUtils.cleanPath(image.getOriginalFilename());
                Path filePath = Paths.get(UPLOAD_DIR, filename);
                Files.write(filePath, image.getBytes());
                String imageUrl = "/" + UPLOAD_DIR + filename;
                imageUrls.add(imageUrl);
            }
            if (imageUrls.isEmpty()) {
                return ResponseEntity.badRequest().body("At least one valid image is required");
            }
            // Detect meal type
            String mealType = detectMealType();
            String date = LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();

            StudentFoodPhoto photo = new StudentFoodPhoto();
            photo.setMealType(mealType);
            photo.setDate(date);
            photo.setImageUrls(imageUrls);
            photo.setDescription(description);
            photo.setUploadedAt(new Date());
            StudentFoodPhoto saved = service.savePhoto(photo);
            return ResponseEntity.ok(saved);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload image(s)");
        }
    }

    @GetMapping("/today")
    public List<StudentFoodPhoto> getTodayPhotos() {
        return service.getTodayPhotos();
    }

    private String detectMealType() {
        LocalTime now = LocalTime.now(ZoneId.of("Asia/Kolkata"));
        if (now.isAfter(LocalTime.of(7, 0)) && now.isBefore(LocalTime.of(10, 1))) return "BREAKFAST";
        if (now.isAfter(LocalTime.of(12, 0)) && now.isBefore(LocalTime.of(15, 1))) return "LUNCH";
        if (now.isAfter(LocalTime.of(16, 0)) && now.isBefore(LocalTime.of(18, 1))) return "SNACKS";
        if (now.isAfter(LocalTime.of(19, 0)) && now.isBefore(LocalTime.of(22, 1))) return "DINNER";
        return "OTHER";
    }
}
