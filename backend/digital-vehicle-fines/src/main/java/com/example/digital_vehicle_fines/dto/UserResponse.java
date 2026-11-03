
package com.example.digital_vehicle_fines.dto;

public record UserResponse(
        Long userId,
        String fullName,
        String email,
        String role
) {
}