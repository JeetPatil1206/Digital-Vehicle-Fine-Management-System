
package com.example.digital_vehicle_fines.controller;

import com.example.digital_vehicle_fines.entity.Dispute;
import com.example.digital_vehicle_fines.entity.Fine;
import com.example.digital_vehicle_fines.entity.User;
import com.example.digital_vehicle_fines.repository.DisputeRepository;
import com.example.digital_vehicle_fines.repository.FineRepository;
import com.example.digital_vehicle_fines.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/disputes")
public class DisputeController {

    private final DisputeRepository disputeRepository;
    private final FineRepository fineRepository;
    private final UserRepository userRepository;

    public DisputeController(
            DisputeRepository disputeRepository,
            FineRepository fineRepository,
            UserRepository userRepository) {
        this.disputeRepository = disputeRepository;
        this.fineRepository = fineRepository;
        this.userRepository = userRepository;
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN"));
    }

    private DisputeResponse toResponse(Dispute dispute) {
        Fine fine = dispute.getFine();

        return new DisputeResponse(
                dispute.getDisputeId(),
                fine.getFineId(),
                fine.getVehicle().getVehicleNumber(),
                dispute.getUser().getUserId(),
                dispute.getReason(),
                dispute.getEvidenceUrl(),
                dispute.getStatus(),
                dispute.getAdminResponse(),
                dispute.getCreatedAt(),
                dispute.getReviewedAt()
        );
    }

    @GetMapping
    public ResponseEntity<?> getDisputes(
            Authentication authentication) {

        if (isAdmin(authentication)) {
            return ResponseEntity.ok(
                    disputeRepository.findAll().stream()
                            .map(this::toResponse)
                            .toList()
            );
        }

        User user = userRepository.findByEmail(
                authentication.getName()).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User account not found"));
        }

        return ResponseEntity.ok(
                disputeRepository.findByUser_UserId(user.getUserId())
                        .stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createDispute(
            @RequestBody DisputeRequest request,
            Authentication authentication) {

        if (request.fineId() == null
                || request.reason() == null
                || request.reason().isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Fine ID and reason are required"));
        }

        User user = userRepository.findByEmail(
                authentication.getName()).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User account not found"));
        }

        Fine fine = fineRepository.findById(request.fineId())
                .orElse(null);

        if (fine == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Fine not found"));
        }

        if (!fine.getVehicle().getOwner().getUserId()
                .equals(user.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error",
                            "You can dispute only fines for your own vehicles"));
        }

        Dispute dispute = new Dispute();
        dispute.setFine(fine);
        dispute.setUser(user);
        dispute.setReason(request.reason().trim());
        dispute.setEvidenceUrl(request.evidenceUrl());
        dispute.setStatus("OPEN");

        Dispute saved = disputeRepository.save(dispute);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toResponse(saved));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDisputeById(
            @PathVariable Long id,
            Authentication authentication) {

        Dispute dispute = disputeRepository.findById(id).orElse(null);

        if (dispute == null) {
            return ResponseEntity.notFound().build();
        }

        if (!isAdmin(authentication)) {
            User user = userRepository.findByEmail(
                    authentication.getName()).orElse(null);

            if (user == null
                    || !dispute.getUser().getUserId()
                            .equals(user.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error",
                                "You cannot access this dispute"));
            }
        }

        return ResponseEntity.ok(toResponse(dispute));
    }

    @PutMapping("/{id}/review")
    @Transactional
    public ResponseEntity<?> reviewDispute(
            @PathVariable Long id,
            @RequestBody ReviewRequest request,
            Authentication authentication) {

        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error",
                            "Only administrators can review disputes"));
        }

        Dispute dispute = disputeRepository.findById(id).orElse(null);

        if (dispute == null) {
            return ResponseEntity.notFound().build();
        }

        if (!"OPEN".equalsIgnoreCase(dispute.getStatus())
                && !"PENDING".equalsIgnoreCase(dispute.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error",
                            "This dispute has already been reviewed"));
        }

        if (request.status() == null) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Status is required"));
        }

        String status = request.status().trim().toUpperCase();

        if (!List.of("ACCEPTED", "REJECTED").contains(status)) {
            return ResponseEntity.badRequest().body(
                    Map.of("error",
                            "Status must be ACCEPTED or REJECTED"));
        }

        dispute.setStatus(status);
        dispute.setAdminResponse(
                request.adminResponse() == null
                        ? ""
                        : request.adminResponse().trim());
        dispute.setReviewedAt(LocalDateTime.now());

        return ResponseEntity.ok(
                toResponse(disputeRepository.save(dispute)));
    }

    public record DisputeRequest(
            Long fineId,
            String reason,
            String evidenceUrl) {}

    public record ReviewRequest(
            String status,
            String adminResponse) {}

    public record DisputeResponse(
            Long disputeId,
            Long fineId,
            String vehicleNumber,
            Long userId,
            String reason,
            String evidenceUrl,
            String status,
            String adminResponse,
            LocalDateTime createdAt,
            LocalDateTime reviewedAt) {}
}
