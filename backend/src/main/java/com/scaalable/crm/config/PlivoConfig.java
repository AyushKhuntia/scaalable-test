package com.scaalable.crm.config;

import com.plivo.api.Plivo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

@Configuration
public class PlivoConfig {

    @Value("${plivo.auth-id}")
    private String authId;

    @Value("${plivo.auth-token}")
    private String authToken;

    @Value("${plivo.phone-number}")
    private String phoneNumber;

    @PostConstruct
    public void initPlivo() {
        if (authId != null && !authId.startsWith("YOUR_")) {
            Plivo.init(authId, authToken);
        } else {
            System.out.println(">>> Plivo credentials not configured - dialer will run in DRY-RUN mode. " +
                    "Set plivo.auth-id / auth-token / phone-number in application.yml.");
        }
    }

    public String getAuthId() { return authId; }

    public String getAuthToken() { return authToken; }

    public String getPhoneNumber() { return phoneNumber; }

    public boolean isConfigured() {
        return authId != null && !authId.startsWith("YOUR_");
    }
}
