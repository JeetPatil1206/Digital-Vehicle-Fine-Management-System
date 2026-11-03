
package com.example.digital_vehicle_fines.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        String database = jdbcTemplate.queryForObject(
                "SELECT DATABASE()", String.class);

        return Map.of(
                "status", "UP",
                "application", "Digital Vehicle Fine Management System",
                "database", database
        );
    }
}