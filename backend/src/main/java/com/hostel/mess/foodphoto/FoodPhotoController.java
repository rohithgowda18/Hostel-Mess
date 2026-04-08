package com.hostel.mess.foodphoto;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/food-photos")
public class FoodPhotoController {
    @Autowired
    private FoodPhotoService foodPhotoService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadPhoto(@RequestParam("image") MultipartFile image,
                                         @RequestParam("mealType") MealType mealType,
                                         @RequestParam("createdBy") String createdBy) {
        try {
            FoodPhoto photo = foodPhotoService.savePhoto(image, mealType, createdBy);
            return ResponseEntity.ok(photo);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Upload failed");
        }
    }

    @GetMapping("")
    public List<FoodPhoto> getCurrentPhotos() {
        return foodPhotoService.getCurrentPhotos();
    }

    @GetMapping("/meal/{mealType}")
    public List<FoodPhoto> getCurrentPhotosByMeal(@PathVariable MealType mealType) {
        return foodPhotoService.getCurrentPhotosByMeal(mealType);
    }
}
