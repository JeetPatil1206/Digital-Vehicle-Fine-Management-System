
package com.example.digital_vehicle_fines.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final JdbcTemplate jdbcTemplate;

    public AdminController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> getAdminDashboard() {

        Map<String, Object> stats = new LinkedHashMap<>();

        stats.put("message", "Admin dashboard loaded successfully");

        stats.put("totalUsers",
                jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM users", Long.class));

        stats.put("totalVehicles",
                jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM vehicles", Long.class));

        stats.put("totalFines",
                jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM fines", Long.class));

        stats.put("pendingFines",
                jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM fines WHERE status = 'PENDING'",
                        Long.class));

        stats.put("totalPayments",
                jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM payments", Long.class));

        stats.put("openDisputes",
                jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM disputes WHERE status = 'PENDING'",
                        Long.class));

        stats.put("role", "ADMIN");

        return stats;
    }
}
