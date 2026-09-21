package com.scaalable.crm.dto;

import com.scaalable.crm.entity.User;
import java.time.LocalDateTime;

/** User representation sent to the frontend (never exposes the password). */
public class UserResponse {
    private Long userId;
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private String role;
    private String status;
    private LocalDateTime createdAt;

    public static UserResponse from(User u) {
        UserResponse r = new UserResponse();
        r.userId = u.getUserId();
        r.fullName = u.getFullName();
        r.username = u.getUsername();
        r.email = u.getEmail();
        r.phone = u.getPhone();
        r.role = u.getRole().name();
        r.status = u.getStatus().name();
        r.createdAt = u.getCreatedAt();
        return r;
    }

    public Long getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getRole() { return role; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
