
package com.example.digital_vehicle_fines.repository;

import com.example.digital_vehicle_fines.entity.Payment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Override
    @EntityGraph(attributePaths = {
        "fine",
        "fine.vehicle",
        "fine.vehicle.owner"
    })
    List<Payment> findAll();

    @EntityGraph(attributePaths = {
        "fine",
        "fine.vehicle",
        "fine.vehicle.owner"
    })
    List<Payment> findByFineFineId(Long fineId);

    @EntityGraph(attributePaths = {
        "fine",
        "fine.vehicle",
        "fine.vehicle.owner"
    })
    List<Payment> findByFine_Vehicle_Owner_UserId(Long userId);
}
