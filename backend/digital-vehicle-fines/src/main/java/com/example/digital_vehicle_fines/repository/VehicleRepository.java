
package com.example.digital_vehicle_fines.repository;

import com.example.digital_vehicle_fines.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    
List<Vehicle> findByOwner_UserId(Long userId);

    List<Vehicle> findByOwnerUserId(Long ownerId);
    boolean existsByVehicleNumber(String vehicleNumber);
}