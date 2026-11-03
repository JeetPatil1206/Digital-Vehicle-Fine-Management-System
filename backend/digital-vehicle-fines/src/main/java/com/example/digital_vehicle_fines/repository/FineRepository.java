
package com.example.digital_vehicle_fines.repository;

import com.example.digital_vehicle_fines.entity.Fine;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FineRepository extends JpaRepository<Fine, Long> {

    @EntityGraph(attributePaths = {"vehicle", "vehicle.owner"})
    List<Fine> findByVehicle_Owner_UserId(Long ownerId);

    @EntityGraph(attributePaths = {"vehicle", "vehicle.owner"})
    List<Fine> findByStatus(String status);

    @Override
    @EntityGraph(attributePaths = {"vehicle", "vehicle.owner"})
    List<Fine> findAll();

    @Override
    @EntityGraph(attributePaths = {"vehicle", "vehicle.owner"})
    Optional<Fine> findById(Long id);
}
