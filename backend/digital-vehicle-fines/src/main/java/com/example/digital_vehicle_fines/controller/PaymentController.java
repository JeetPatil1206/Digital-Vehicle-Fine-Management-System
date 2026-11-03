
package com.example.digital_vehicle_fines.controller;

import com.example.digital_vehicle_fines.entity.Fine;
import com.example.digital_vehicle_fines.entity.Payment;
import com.example.digital_vehicle_fines.entity.User;
import com.example.digital_vehicle_fines.repository.FineRepository;
import com.example.digital_vehicle_fines.repository.PaymentRepository;
import com.example.digital_vehicle_fines.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final FineRepository fineRepository;
    private final UserRepository userRepository;

    public PaymentController(
            PaymentRepository paymentRepository,
            FineRepository fineRepository,
            UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.fineRepository = fineRepository;
        this.userRepository = userRepository;
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN"));
    }

    private PaymentResponse toResponse(Payment payment) {
        Fine fine = payment.getFine();

        return new PaymentResponse(
                payment.getPaymentId(),
                fine.getFineId(),
                fine.getVehicle().getVehicleNumber(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getTransactionReference(),
                payment.getPaymentStatus(),
                payment.getPaidAt()
        );
    }

    @GetMapping
    public ResponseEntity<?> getPayments(
            Authentication authentication) {

        if (isAdmin(authentication)) {
            return ResponseEntity.ok(
                    paymentRepository.findAll().stream()
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
                paymentRepository
                        .findByFine_Vehicle_Owner_UserId(user.getUserId())
                        .stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createPayment(
            @RequestBody PaymentRequest request,
            Authentication authentication) {

        if (request.fineId() == null
                || request.paymentMethod() == null
                || request.paymentMethod().isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error",
                            "Fine ID and payment method are required"));
        }

        Fine fine = fineRepository.findById(request.fineId())
                .orElse(null);

        if (fine == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Fine not found"));
        }

        if (!isAdmin(authentication)) {
            User user = userRepository.findByEmail(
                    authentication.getName()).orElse(null);

            if (user == null
                    || !fine.getVehicle().getOwner().getUserId()
                            .equals(user.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error",
                                "You cannot pay another owner's fine"));
            }
        }

        if (!"PENDING".equalsIgnoreCase(fine.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error",
                            "Only pending fines can be paid"));
        }

        String method = request.paymentMethod().trim().toUpperCase();

        if (!List.of("UPI", "CARD", "NET_BANKING", "CASH")
                .contains(method)) {
            return ResponseEntity.badRequest().body(
                    Map.of("error",
                            "Use UPI, CARD, NET_BANKING, or CASH"));
        }

        Payment payment = new Payment();
        payment.setFine(fine);
        payment.setAmount(fine.getFineAmount());
        payment.setPaymentMethod(method);
        payment.setTransactionReference(
                "SIM-" + UUID.randomUUID());
        payment.setPaymentStatus("SUCCESS");
        payment.setPaidAt(LocalDateTime.now());

        fine.setStatus("PAID");

        Payment saved = paymentRepository.save(payment);
        fineRepository.save(fine);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toResponse(saved));
    }

    public record PaymentRequest(
            Long fineId,
            String paymentMethod) {}

    public record PaymentResponse(
            Long paymentId,
            Long fineId,
            String vehicleNumber,
            BigDecimal amount,
            String paymentMethod,
            String transactionReference,
            String paymentStatus,
            LocalDateTime paidAt) {}
}
