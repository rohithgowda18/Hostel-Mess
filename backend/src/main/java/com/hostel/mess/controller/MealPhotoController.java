package com.hostel.mess.controller;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.hostel.mess.model.MealPhoto;
import com.hostel.mess.model.MealService;
import com.hostel.mess.model.User;
import com.hostel.mess.repository.MealPhotoRepository;
import com.hostel.mess.repository.UserRepository;
import com.hostel.mess.service.MealServiceLifecycleService;
import com.hostel.mess.service.WebSocketEventService;

/**
 * Controller for meal photo evidence and official dish photography.
 * Metadata is stored in MongoDB document collection 'meal_photos',
 * and raw image binaries are streamed into MongoDB GridFS.
 */
@RestController
@RequestMapping("/api/student-photos")
public class MealPhotoController {

    @Autowired
    private MealPhotoRepository photoRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private GridFsTemplate gridFsTemplate;

    @Autowired(required = false)
    private WebSocketEventService wsService;

    @Autowired
    private MealServiceLifecycleService mealServiceLifecycleService;

    private static final String UPLOAD_DIR = "uploads/student-photos/";
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final int MAX_FILES = 5;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadPhoto(
            @RequestParam("images") List<MultipartFile> images,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "mealType", required = false) String mealTypeParam,
            Principal principal) {

        if (images == null || images.isEmpty() || images.stream().allMatch(MultipartFile::isEmpty)) {
            return ResponseEntity.badRequest().body(Map.of("error", "At least one image is required"));
        }
        if (images.size() > MAX_FILES) {
            return ResponseEntity.badRequest().body(Map.of("error", "Maximum " + MAX_FILES + " images per upload"));
        }

        try {
            String uploaderEmail = principal != null ? principal.getName() : "student@hostel.app";
            User user = userRepository.findById(uploaderEmail).orElse(null);
            String uploaderName = (user != null && user.getEmail() != null) ? user.getEmail().split("@")[0] : uploaderEmail.split("@")[0];
            boolean isAdmin = user != null && "ADMIN".equalsIgnoreCase(user.getRole());

            String mealType = (mealTypeParam != null && !mealTypeParam.trim().isEmpty())
                    ? mealTypeParam.toUpperCase()
                    : detectMealType();

            String today = LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();
            MealService currentService = mealServiceLifecycleService.getCurrentOrNextService();
            String mealServiceId = currentService != null ? currentService.getId() : null;

            List<String> gridFsIds = new ArrayList<>();
            List<String> imageUrls = new ArrayList<>();

            for (MultipartFile image : images) {
                if (image.isEmpty()) continue;

                String contentType = image.getContentType();
                String ext = StringUtils.getFilenameExtension(StringUtils.cleanPath(image.getOriginalFilename() == null ? "" : image.getOriginalFilename()));
                ext = ext == null ? "jpg" : ext.toLowerCase();

                if (!ALLOWED_EXTENSIONS.contains(ext) || (contentType != null && !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase()))) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Only JPG, PNG, and WEBP images are allowed"));
                }

                String filename = UUID.randomUUID() + "." + ext;

                // 1. Primary: Store in MongoDB GridFS
                if (gridFsTemplate != null) {
                    try (InputStream is = image.getInputStream()) {
                        ObjectId gridId = gridFsTemplate.store(is, filename, contentType != null ? contentType : "image/jpeg");
                        gridFsIds.add(gridId.toString());
                    }
                }

                // 2. Fallback: Local disk cache
                try {
                    File dir = new File(UPLOAD_DIR);
                    if (!dir.exists()) dir.mkdirs();
                    Path filePath = Paths.get(UPLOAD_DIR, filename).normalize();
                    if (filePath.startsWith(Paths.get(UPLOAD_DIR).normalize())) {
                        Files.write(filePath, image.getBytes());
                        imageUrls.add("/" + UPLOAD_DIR + filename);
                    }
                } catch (Exception ignored) {}
            }

            MealPhoto photo = new MealPhoto();
            photo.setMealServiceId(mealServiceId);
            photo.setMealType(mealType);
            photo.setDate(today);
            photo.setUploadedBy(uploaderName);
            photo.setUserEmail(uploaderEmail);
            photo.setType(isAdmin ? "OFFICIAL" : "COMMUNITY");
            photo.setGridFsFileId(gridFsIds.isEmpty() ? null : gridFsIds.get(0));
            photo.setImageUrls(imageUrls);
            photo.setDescription(description != null ? description : "Live meal plate photo");
            photo.setVisibility("VISIBLE");
            photo.setModerationStatus("APPROVED");
            photo.setUploadedAt(new Date());

            MealPhoto saved = photoRepository.save(photo);

            // Set canonical image stream URL
            saved.getImageUrls().add(0, "/api/student-photos/" + saved.getId() + "/image");
            saved = photoRepository.save(saved);

            if (wsService != null) {
                wsService.broadcastAppEvent("MEAL_PHOTO_ADDED", saved);
            }

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        }
    }

    @GetMapping("/today")
    public List<MealPhoto> getTodayPhotos() {
        String today = LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();
        List<MealPhoto> todays = photoRepository.findByDate(today);
        return todays.size() > 100 ? todays.subList(todays.size() - 100, todays.size()) : todays;
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<?> streamImage(@PathVariable String id) {
        Optional<MealPhoto> opt = photoRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        MealPhoto photo = opt.get();

        // 1. Stream from GridFS
        if (photo.getGridFsFileId() != null && gridFsTemplate != null) {
            try {
                com.mongodb.client.gridfs.model.GridFSFile gridFile = gridFsTemplate.findOne(
                        new Query(Criteria.where("_id").is(new ObjectId(photo.getGridFsFileId())))
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

        // 2. Disk fallback
        if (!photo.getImageUrls().isEmpty()) {
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

    private String detectMealType() {
        LocalTime now = LocalTime.now(ZoneId.of("Asia/Kolkata"));
        if (now.isAfter(LocalTime.of(7, 0)) && now.isBefore(LocalTime.of(10, 1))) return "BREAKFAST";
        if (now.isAfter(LocalTime.of(12, 0)) && now.isBefore(LocalTime.of(15, 1))) return "LUNCH";
        if (now.isAfter(LocalTime.of(16, 0)) && now.isBefore(LocalTime.of(18, 1))) return "SNACKS";
        if (now.isAfter(LocalTime.of(19, 0)) && now.isBefore(LocalTime.of(22, 1))) return "DINNER";
        return "LUNCH";
    }
}
