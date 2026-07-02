package com.bankplatform.auth.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Client HTTP vers le customer-service.
 * Appelé après chaque inscription pour créer automatiquement le profil client.
 */
@Component
public class CustomerServiceClient {

    private static final Logger log = LoggerFactory.getLogger(CustomerServiceClient.class);

    private final RestTemplate restTemplate;

    @Value("${services.customer-service.url:http://localhost:8082}")
    private String customerServiceUrl;

    public CustomerServiceClient() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Crée un profil client dans customer-service.
     * Non-bloquant : en cas d'erreur, on log sans faire échouer l'inscription.
     */
    public void createCustomerProfile(UUID userId, String firstName, String lastName,
                                       String email, String phoneNumber) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("userId", userId.toString());
            body.put("firstName", firstName);
            body.put("lastName", (lastName != null && !lastName.isBlank()) ? lastName : "-");
            body.put("email", email);
            body.put("phoneNumber", phoneNumber != null ? phoneNumber : "");
            body.put("status", "PENDING");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                customerServiceUrl + "/customers",
                request,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Profil client créé dans customer-service pour userId={}", userId);
            } else {
                log.warn("customer-service a retourné {} pour userId={}", response.getStatusCode(), userId);
            }

        } catch (Exception e) {
            // Non-bloquant : l'inscription réussit même si customer-service est indisponible
            log.warn("Impossible de créer le profil client dans customer-service pour userId={} : {}",
                userId, e.getMessage());
        }
    }
}
