package com.hostel.mess.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hostel.mess.model.StudentFoodPhoto;
import com.hostel.mess.repository.StudentFoodPhotoRepository;

@Service
public class StudentFoodPhotoService {
    @Autowired
    private StudentFoodPhotoRepository repository;

    public StudentFoodPhoto savePhoto(StudentFoodPhoto photo) {
        return repository.save(photo);
    }

    public List<StudentFoodPhoto> getTodayPhotos() {
        String today = LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();
        return repository.findByDate(today);
    }
}
