package com.hostel.mess.controller;

import com.hostel.mess.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService service;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats() {
        Map<String, Object> stats = service.getDashboardAnalytics();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/occupancy")
    public ResponseEntity<?> getOccupancyStats() {
        return ResponseEntity.ok(service.getOccupancyStats());
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportStatsCsv() {
        String csv = service.generateCsvExport();
        byte[] bytes = csv.getBytes();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=mess_analytics.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }
}
