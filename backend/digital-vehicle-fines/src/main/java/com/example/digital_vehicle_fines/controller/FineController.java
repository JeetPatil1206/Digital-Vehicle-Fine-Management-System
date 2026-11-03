
package com.example.digital_vehicle_fines.controller;

import com.example.digital_vehicle_fines.entity.Fine;
import com.example.digital_vehicle_fines.entity.Vehicle;
import com.example.digital_vehicle_fines.repository.FineRepository;
import com.example.digital_vehicle_fines.repository.UserRepository;
import com.example.digital_vehicle_fines.repository.VehicleRepository;
import com.example.digital_vehicle_fines.entity.User;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fines")
public class FineController {

    private final FineRepository fineRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public FineController(
            FineRepository fineRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository) {
        this.fineRepository = fineRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority ->
                        authority.getAuthority().equals("ROLE_ADMIN"));
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElse(null);
    }

    private FineResponse toResponse(Fine fine) {
        Vehicle vehicle = fine.getVehicle();

        return new FineResponse(
                fine.getFineId(),
                vehicle.getVehicleId(),
                vehicle.getVehicleNumber(),
                fine.getViolationType(),
                fine.getDescription(),
                fine.getFineAmount(),
                fine.getIssuedAt(),
                fine.getDueDate(),
                fine.getStatus()
        );
    }

    // Only administrators can create fines
    @PostMapping
    public ResponseEntity<?> createFine(
            @RequestBody FineRequest request,
            Authentication authentication) {

        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error",
                            "Only administrators can create fines"));
        }

        if (request.vehicleId() == null
                || request.violationType() == null
                || request.violationType().isBlank()
                || request.fineAmount() == null
                || request.fineAmount().compareTo(BigDecimal.ZERO) <= 0) {

            return ResponseEntity.badRequest().body(
                    Map.of("error",
                            "Vehicle ID, violation type, and positive fine amount are required"));
        }

        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElse(null);

        if (vehicle == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Vehicle not found"));
        }

        Fine fine = new Fine();
        fine.setVehicle(vehicle);
        fine.setViolationType(request.violationType().trim());
        fine.setDescription(request.description());
        fine.setFineAmount(request.fineAmount());
        fine.setDueDate(
                request.dueDate() != null
                        ? request.dueDate()
                        : LocalDate.now().plusDays(30)
        );
        fine.setStatus("PENDING");

        Fine saved = fineRepository.save(fine);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toResponse(saved));
    }

    // Admin sees all fines; owners see only their own fines
    @GetMapping
    public ResponseEntity<?> getAllFines(
            Authentication authentication) {

        if (isAdmin(authentication)) {
            return ResponseEntity.ok(
                    fineRepository.findAll().stream()
                            .map(this::toResponse)
                            .toList()
            );
        }

        User user = getCurrentUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User account not found"));
        }

        List<FineResponse> fines =
                fineRepository.findByVehicle_Owner_UserId(user.getUserId())
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(fines);
    }

    // A fine can be viewed only by its owner or an administrator
    @GetMapping("/{id}")
    public ResponseEntity<?> getFineById(
            @PathVariable Long id,
            Authentication authentication) {

        Fine fine = fineRepository.findById(id).orElse(null);

        if (fine == null) {
            return ResponseEntity.notFound().build();
        }

        if (!isAdmin(authentication)) {
            User user = getCurrentUser(authentication);

            if (user == null
                    || !fine.getVehicle().getOwner().getUserId()
                            .equals(user.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error",
                                "You cannot access this fine"));
            }
        }

        return ResponseEntity.ok(toResponse(fine));
    }

    public record FineRequest(
            Long vehicleId,
            String violationType,
            String description,
            BigDecimal fineAmount,
            LocalDate dueDate
    ) {}

    public record FineResponse(
            Long fineId,
            Long vehicleId,
            String vehicleNumber,
            String violationType,
            String description,
            BigDecimal fineAmount,
            LocalDateTime issuedAt,
            LocalDate dueDate,
            String status
    ) {}
}
