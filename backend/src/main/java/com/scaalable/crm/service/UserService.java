package com.scaalable.crm.service;

import com.scaalable.crm.dto.CreateUserRequest;
import com.scaalable.crm.dto.UserResponse;
import com.scaalable.crm.entity.Role;
import com.scaalable.crm.entity.User;
import com.scaalable.crm.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public UserService(UserRepository userRepository,
                       org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
                       org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username '" + request.getUsername() + "' is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email '" + request.getEmail() + "' is already in use");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(parseRole(request.getRole()));
        user.setStatus(User.Status.ACTIVE);

        return UserResponse.from(userRepository.save(user));
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getByRole(String role) {
        return userRepository.findByRole(parseRole(role)).stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse setStatus(Long userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setStatus("INACTIVE".equalsIgnoreCase(status) ? User.Status.INACTIVE : User.Status.ACTIVE);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found: " + userId);
        }
        jdbcTemplate.update("DELETE FROM lead_assignments WHERE assigned_to = ? OR assigned_by = ?", userId, userId);
        jdbcTemplate.update("DELETE FROM call_logs WHERE user_id = ?", userId);
        jdbcTemplate.update("UPDATE leads SET created_by = NULL WHERE created_by = ?", userId);
        userRepository.deleteById(userId);
    }

    private Role parseRole(String role) {
        try {
            return Role.valueOf(role.trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid role '" + role + "'. Allowed: ADMIN, MANAGER, AGENT");
        }
    }
}
