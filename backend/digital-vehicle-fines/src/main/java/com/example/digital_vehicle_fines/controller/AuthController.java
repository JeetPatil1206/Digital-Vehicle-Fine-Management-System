
package com.example.digital_vehicle_fines.controller;

import com.example.digital_vehicle_fines.dto.UserResponse;
import com.example.digital_vehicle_fines.entity.User;
import com.example.digital_vehicle_fines.repository.UserRepository;
import com.example.digital_vehicle_fines.service.JwtService;
import com.example.digital_vehicle_fines.service.UserService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthController(
            UserService userService,
            UserRepository userRepository,
            JwtService jwtService) {

        this.userService = userService;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {

        if (request.fullName() == null || request.fullName().isBlank()
                || request.email() == null || request.email().isBlank()
                || request.password() == null
                || request.password().length() < 8) {

            return ResponseEntity.badRequest().body(
                    Map.of("error",
                    "Enter your name, email, and a password of at least 8 characters")
            );
        }

        try {
            User user = userService.registerOwner(
                    request.fullName(),
                    request.email(),
                    request.password()
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(toResponse(user));

        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        if (request.email() == null || request.password() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email and password are required"));
        }

        User user = userRepository.findByEmail(
                request.email().trim().toLowerCase()
        ).orElse(null);

        if (user == null
                || !userService.verifyPassword(user, request.password())) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
        }

        String token = jwtService.generateToken(user);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "tokenType", "Bearer",
                "user", toResponse(user)
        ));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }

    public record RegisterRequest(
            String fullName,
            String email,
            String password
    ) {}

    public record LoginRequest(
            String email,
            String password
    ) {}
}