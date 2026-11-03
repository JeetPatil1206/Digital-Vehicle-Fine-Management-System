
package com.example.digital_vehicle_fines.controller;

import com.example.digital_vehicle_fines.entity.Vehicle;
import com.example.digital_vehicle_fines.repository.VehicleRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/vehicles")
public class AdminVehicleController {

    private final VehicleRepository vehicleRepository;

    public AdminVehicleController(
            VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    // View all registered vehicles
    @GetMapping
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllVehicles() {
        return vehicleRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Update a vehicle's number and type
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateVehicle(
            @PathVariable Long id,
            @RequestBody VehicleRequest request) {

        Vehicle vehicle = vehicleRepository.findById(id)
                .orElse(null);

        if (vehicle == null) {
            return ResponseEntity.notFound().build();
        }

        if (request.vehicleNumber() == null
                || request.vehicleNumber().isBlank()
                || request.vehicleType() == null
                || request.vehicleType().isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "error",
                            "Vehicle number and vehicle type are required"
                    )
            );
        }

        String number = request.vehicleNumber()
                .trim()
                .toUpperCase();

        boolean usedByAnotherVehicle =
                vehicleRepository.existsByVehicleNumber(number)
                && !number.equalsIgnoreCase(
                        vehicle.getVehicleNumber()
                );

        if (usedByAnotherVehicle) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "error",
                            "Vehicle number is already registered"
                    )
            );
        }

        vehicle.setVehicleNumber(number);
        vehicle.setVehicleType(request.vehicleType().trim());

        Vehicle saved = vehicleRepository.save(vehicle);

        return ResponseEntity.ok(toResponse(saved));
    }

    // Delete a vehicle
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVehicle(
            @PathVariable Long id) {

        if (!vehicleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        try {
            vehicleRepository.deleteById(id);
            return ResponseEntity.ok(
                    Map.of("message", "Vehicle deleted successfully")
            );
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "error",
                            "This vehicle cannot be deleted because related records exist."
                    )
            );
        }
    }

    private Map<String, Object> toResponse(Vehicle vehicle) {
        return Map.of(
                "vehicleId", vehicle.getVehicleId(),
                "vehicleNumber", vehicle.getVehicleNumber(),
                "vehicleType", vehicle.getVehicleType() == null
                        ? ""
                        : vehicle.getVehicleType(),
                "ownerId", vehicle.getOwner().getUserId(),
                "ownerName", vehicle.getOwner().getFullName()
        );
    }

    public record VehicleRequest(
            String vehicleNumber,
            String vehicleType
    ) {}
}
