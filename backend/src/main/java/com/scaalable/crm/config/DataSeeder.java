package com.scaalable.crm.config;

import com.scaalable.crm.entity.Disposition;
import com.scaalable.crm.entity.Role;
import com.scaalable.crm.entity.User;
import com.scaalable.crm.repository.DispositionRepository;
import com.scaalable.crm.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds default reference data on first startup:
 *   - default ADMIN user  ->  username: admin / password: admin
 *   - standard call dispositions
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DispositionRepository dispositionRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      DispositionRepository dispositionRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.dispositionRepository = dispositionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // --- default admin (admin / admin) ---
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setFullName("System Administrator");
            admin.setUsername("admin");
            admin.setEmail("admin@scaalable.com");
            admin.setPassword(passwordEncoder.encode("admin"));
            // no phone — the agent must supply their own phone in the Dialer
            // ("Your phone" field) before outbound calls can be placed.
            admin.setRole(Role.ADMIN);
            admin.setStatus(User.Status.ACTIVE);
            userRepository.save(admin);
            System.out.println(">>> Seeded default admin: username=admin password=admin");
        }

        // --- call dispositions ---
        if (dispositionRepository.count() == 0) {
            dispositionRepository.saveAll(List.of(
                    new Disposition("CONNECTED",     "Call was answered and conversation happened"),
                    new Disposition("NO_ANSWER",     "Rang out, nobody picked up"),
                    new Disposition("BUSY",          "Line was busy"),
                    new Disposition("VOICEMAIL",     "Reached voicemail, left message"),
                    new Disposition("WRONG_NUMBER",  "Number is invalid / not the lead"),
                    new Disposition("CALLBACK",      "Lead asked to be called back"),
                    new Disposition("NOT_INTERESTED","Lead declined the offer"),
                    new Disposition("CONVERTED",     "Lead became a customer")
            ));
            System.out.println(">>> Seeded default dispositions");
        }
    }
}
