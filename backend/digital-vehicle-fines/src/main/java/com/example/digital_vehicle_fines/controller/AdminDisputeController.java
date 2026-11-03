
package com.example.digital_vehicle_fines.controller;

import com.example.digital_vehicle_fines.entity.Dispute;
import com.example.digital_vehicle_fines.repository.DisputeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/disputes")
public class AdminDisputeController {

    private final DisputeRepository disputeRepository;

    public AdminDisputeController(
            DisputeRepository disputeRepository) {
        this.disputeRepository = disputeRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllDisputes() {
        List<Dispute> disputes = disputeRepository.findAll();

        return disputes.stream().map(dispute -> {
            Map<String, Object> result = new LinkedHashMap<>();

            result.put("disputeId", dispute.getDisputeId());
            result.put("fineId", dispute.getFine().getFineId());
            result.put("userId", dispute.getUser().getUserId());
            result.put("reason", dispute.getReason());
            result.put("evidenceUrl", dispute.getEvidenceUrl());
            result.put("status", dispute.getStatus());
            result.put("adminResponse", dispute.getAdminResponse());
            result.put("createdAt", dispute.getCreatedAt());
            result.put("reviewedAt", dispute.getReviewedAt());

            return result;
        }).toList();
    }

    @PatchMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateDispute(
            @PathVariable Long id,
            @RequestBody DisputeUpdateRequest request) {

        Dispute dispute = disputeRepository.findById(id)
                .orElse(null);

        if (dispute == null) {
            return ResponseEntity.notFound().build();
        }

        if (request.status() == null
                || !(request.status().equals("APPROVED")
                || request.status().equals("REJECTED"))) {
            return ResponseEntity.badRequest().body(
                    Map.of("error",
                            "Status must be APPROVED or REJECTED"));
        }

        dispute.setStatus(request.status());

        if (request.adminResponse() != null) {
            dispute.setAdminResponse(request.adminResponse());
        }

        Dispute saved = disputeRepository.save(dispute);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("disputeId", saved.getDisputeId());
        response.put("status", saved.getStatus());
        response.put("adminResponse",
                saved.getAdminResponse() == null
                        ? "" : saved.getAdminResponse());

        return ResponseEntity.ok(response);
    }

    public record DisputeUpdateRequest(
            String status,
            String adminResponse) {
    }
}