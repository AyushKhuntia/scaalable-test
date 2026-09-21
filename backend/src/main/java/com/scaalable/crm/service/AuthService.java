package com.scaalable.crm.service;

import com.scaalable.crm.dto.LoginRequest;
import com.scaalable.crm.dto.LoginResponse;
import com.scaalable.crm.entity.User;
import com.scaalable.crm.repository.UserRepository;
import com.scaalable.crm.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }
        if (user.getStatus() != User.Status.ACTIVE) {
            throw new RuntimeException("Account is inactive. Contact your administrator.");
        }

        String token = tokenProvider.generateToken(
                user.getUserId(), user.getUsername(), user.getRole().name());

        return new LoginResponse(token, user.getUserId(), user.getUsername(),
                user.getFullName(), user.getRole().name());
    }
}
