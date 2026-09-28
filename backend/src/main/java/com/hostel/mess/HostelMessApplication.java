package com.hostel.mess;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HostelMessApplication {

    public static void main(String[] args) {
        SpringApplication.run(HostelMessApplication.class, args);
    }
}
