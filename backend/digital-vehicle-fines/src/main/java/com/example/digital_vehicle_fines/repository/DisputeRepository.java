
package com.example.digital_vehicle_fines.repository;

import com.example.digital_vehicle_fines.entity.Dispute;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DisputeRepository extends JpaRepository<Dispute, Long> {

    @EntityGraph(attributePaths = {"fine", "fine.vehicle", "user"})
    List<Dispute> findByUser_UserId(Long userId);

    @EntityGraph(attributePaths = {"fine", "fine.vehicle", "user"})
    List<Dispute> findByStatus(String status);

    @Override
    @EntityGraph(attributePaths = {"fine", "fine.vehicle", "user"})
    List<Dispute> findAll();

    @Override
    @EntityGraph(attributePaths = {"fine", "fine.vehicle", "user"})
    Optional<Dispute> findById(Long id);
}
