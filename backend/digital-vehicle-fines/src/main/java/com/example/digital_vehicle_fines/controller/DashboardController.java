
package com.example.digital_vehicle_fines.controller;

import com.example.digital_vehicle_fines.entity.User;
import com.example.digital_vehicle_fines.repository.UserRepository;
import com.example.digital_vehicle_fines.repository.VehicleRepository;
import com.example.digital_vehicle_fines.repository.FineRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final FineRepository fineRepository;

    public DashboardController(
            UserRepository userRepository,
            VehicleRepository vehicleRepository,
            FineRepository fineRepository) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.fineRepository = fineRepository;
    }

    @GetMapping
    public ResponseEntity<?> getDashboard(Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Please log in first"));
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "User not found"));
        }

        Long userId = user.getUserId();

        List<Map<String, Object>> vehicles =
                vehicleRepository.findByOwnerUserId(userId)
                        .stream()
                        .map(vehicle -> Map.<String, Object>of(
                                "vehicleId", vehicle.getVehicleId(),
                                "vehicleNumber", vehicle.getVehicleNumber(),
                                "vehicleType", vehicle.getVehicleType()
                        ))
                        .toList();

        List<Map<String, Object>> fines =
                fineRepository.findByVehicle_Owner_UserId(userId)
                        .stream()
                        .map(fine -> Map.<String, Object>of(
                                "fineId", fine.getFineId(),
                                "vehicleNumber",
                                fine.getVehicle().getVehicleNumber(),
                                "violationType", fine.getViolationType(),
                                "description", fine.getDescription(),
                                "fineAmount", fine.getFineAmount(),
                                "dueDate", fine.getDueDate(),
                                "status", fine.getStatus()
                        ))
                        .toList();

        return ResponseEntity.ok(Map.of(
                "message", "Dashboard loaded successfully",
                "userId", userId,
                "fullName", user.getFullName(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "vehicles", vehicles,
                "fines", fines
        ));
    }
}
