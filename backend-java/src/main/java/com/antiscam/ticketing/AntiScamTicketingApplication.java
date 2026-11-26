package com.antiscam.ticketing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AntiScamTicketingApplication {

    public static void main(String[] args) {
        SpringApplication.run(AntiScamTicketingApplication.class, args);
    }
}
