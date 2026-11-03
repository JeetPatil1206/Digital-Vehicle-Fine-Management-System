
package com.example.digital_vehicle_fines.controller;

import com.example.digital_vehicle_fines.entity.User;
import com.example.digital_vehicle_fines.entity.Vehicle;
import com.example.digital_vehicle_fines.repository.UserRepository;
import com.example.digital_vehicle_fines.repository.VehicleRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public VehicleController(
            VehicleRepository vehicleRepository,
            UserRepository userRepository) {
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    // Add a vehicle for the currently logged-in user
    @PostMapping
    public ResponseEntity<?> addVehicle(
            @RequestBody VehicleRequest request,
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Please log in"));
        }

        if (request.vehicleNumber() == null
                || request.vehicleNumber().isBlank()
                || request.vehicleType() == null
                || request.vehicleType().isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error",
                            "Vehicle number and vehicle type are required")
            );
        }

        String vehicleNumber = request.vehicleNumber()
                .trim().toUpperCase();

        if (vehicleRepository.existsByVehicleNumber(vehicleNumber)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of("error", "Vehicle number is already registered")
            );
        }

        String email = authentication.getName();

        User owner = userRepository.findByEmail(email)
                .orElse(null);

        if (owner == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User account not found"));
        }

        Vehicle vehicle = new Vehicle();
        vehicle.setVehicleNumber(vehicleNumber);
        vehicle.setVehicleType(request.vehicleType().trim());
        vehicle.setOwner(owner);

        Vehicle saved = vehicleRepository.save(vehicle);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                new VehicleResponse(
                        saved.getVehicleId(),
                        saved.getVehicleNumber(),
                        saved.getVehicleType(),
                        owner.getUserId()
                )
        );
    }

    // Retrieve vehicles belonging only to the logged-in user
    @GetMapping
    public ResponseEntity<?> getVehicles(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Please log in"));
        }

        String email = authentication.getName();

        User owner = userRepository.findByEmail(email)
                .orElse(null);

        if (owner == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User account not found"));
        }

        List<VehicleResponse> vehicles =
                vehicleRepository.findByOwner_UserId(owner.getUserId())
                        .stream()
                        .map(vehicle -> new VehicleResponse(
                                vehicle.getVehicleId(),
                                vehicle.getVehicleNumber(),
                                vehicle.getVehicleType(),
                                owner.getUserId()
                        ))
                        .toList();

        return ResponseEntity.ok(vehicles);
    }

    // Request data for adding a vehicle
    public record VehicleRequest(
            String vehicleNumber,
            String vehicleType,
            Long ownerId
    ) {}

    // Safe response data for the frontend
    public record VehicleResponse(
            Long vehicleId,
            String vehicleNumber,
            String vehicleType,
            Long ownerId
    ) {}
}
