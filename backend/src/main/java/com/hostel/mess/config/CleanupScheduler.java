package com.hostel.mess.config;

import com.hostel.mess.repository.ChatRepository;
import com.hostel.mess.repository.ComplaintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class CleanupScheduler {

    private final ChatRepository chatRepository;
    private final ComplaintRepository complaintRepository;

    @Autowired
    public CleanupScheduler(ChatRepository chatRepository, ComplaintRepository complaintRepository) {
        this.chatRepository = chatRepository;
        this.complaintRepository = complaintRepository;
    }

    // Runs every hour
    @Scheduled(cron = "0 0 * * * *")
    public void cleanupUniversalChatMessages() {
        Instant cutoff = Instant.now().minus(24, ChronoUnit.HOURS);
        long deleted = chatRepository.deleteByChatTypeAndCreatedAtBefore("UNIVERSAL", cutoff);
        if (deleted > 0) {
            System.out.println("[Cleanup] Deleted " + deleted + " universal chat messages older than 24h");
        }
    }

    // Runs daily at 2:30 AM
    @Scheduled(cron = "0 30 2 * * *")
    public void cleanupOldComplaints() {
        Instant cutoff = Instant.now().minus(7, ChronoUnit.DAYS);
        long deleted = complaintRepository.deleteByCreatedAtBefore(cutoff);
        if (deleted > 0) {
            System.out.println("[Cleanup] Deleted " + deleted + " complaints older than 7 days");
        }
    }
}
