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

import com.hostel.mess.model.MealPhoto;
import com.hostel.mess.repository.MealPhotoRepository;

@RestController
@RequestMapping("/api/student-photos")
public class MealPhotoController {
    @Autowired
    private MealPhotoRepository photoRepository;

    @Autowired
    private com.hostel.mess.service.WebSocketEventService wsService;

    private static final String UPLOAD_DIR = "uploads/student-photos/";
    private static final java.util.Set<String> ALLOWED_EXTENSIONS = java.util.Set.of("jpg", "jpeg", "png", "webp");
    private static final java.util.Set<String> ALLOWED_CONTENT_TYPES = java.util.Set.of("image/jpeg", "image/png", "image/webp");
    private static final int MAX_FILES = 5;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadPhoto(@RequestParam("images") List<MultipartFile> images,
                                         @RequestParam(value = "description", required = false) String description) {
        if (images == null || images.isEmpty() || images.stream().allMatch(MultipartFile::isEmpty)) {
            return ResponseEntity.badRequest().body("At least one image is required");
        }
        if (images.size() > MAX_FILES) {
            return ResponseEntity.badRequest().body("Maximum " + MAX_FILES + " images per upload");
        }
        try {
            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) dir.mkdirs();
            List<String> imageUrls = new java.util.ArrayList<>();
            for (MultipartFile image : images) {
                if (image.isEmpty()) continue;
                String contentType = image.getContentType();
                String ext = StringUtils.getFilenameExtension(StringUtils.cleanPath(image.getOriginalFilename() == null ? "" : image.getOriginalFilename()));
                ext = ext == null ? "" : ext.toLowerCase();
                if (!ALLOWED_EXTENSIONS.contains(ext) || (contentType != null && !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase()))) {
                    return ResponseEntity.badRequest().body("Only JPG/PNG/WEBP images are allowed");
                }
                String filename = UUID.randomUUID() + "." + ext;
                Path filePath = Paths.get(UPLOAD_DIR, filename).normalize();
                if (!filePath.startsWith(Paths.get(UPLOAD_DIR).normalize())) {
                    return ResponseEntity.badRequest().body("Invalid file name");
                }
                Files.write(filePath, image.getBytes());
                String imageUrl = "/" + UPLOAD_DIR + filename;
                imageUrls.add(imageUrl);
            }
            if (imageUrls.isEmpty()) {
                return ResponseEntity.badRequest().body("At least one valid image is required");
            }
            String mealType = detectMealType();
            String date = LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();

            MealPhoto photo = new MealPhoto();
            photo.setMealType(mealType);
            photo.setDate(date);
            photo.setImageUrls(imageUrls);
            photo.setDescription(description);
            photo.setUploadedAt(new Date());
            MealPhoto saved = photoRepository.save(photo);
            
            wsService.broadcastAppEvent("PHOTO_UPLOADED", saved);
            
            return ResponseEntity.ok(saved);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload image(s)");
        }
    }

    @GetMapping("/today")
    public List<MealPhoto> getTodayPhotos() {
        String today = LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();
        List<MealPhoto> todays = photoRepository.findByDate(today);
        return todays.size() > 100 ? todays.subList(todays.size() - 100, todays.size()) : todays;
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
