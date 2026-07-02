package com.bankplatform.auth.service;

import com.bankplatform.auth.client.CustomerServiceClient;
import com.bankplatform.auth.dto.AuthResponse;
import com.bankplatform.auth.dto.LoginRequest;
import com.bankplatform.auth.dto.RegisterRequest;
import com.bankplatform.auth.entity.RefreshToken;
import com.bankplatform.auth.entity.User;
import com.bankplatform.auth.entity.UserRole;
import com.bankplatform.auth.repository.RefreshTokenRepository;
import com.bankplatform.auth.repository.UserRepository;
import com.bankplatform.auth.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomerServiceClient customerServiceClient;

    @Autowired
    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       CustomerServiceClient customerServiceClient) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.customerServiceClient = customerServiceClient;
    }

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Vérifier si l'email existe déjà
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Un compte avec cet email existe déjà");
        }

        // Créer l'utilisateur
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(request.getRole())
                .isActive(true)
                .build();

        user = userRepository.save(user);

        // Si CLIENT → créer automatiquement le profil dans customer-service
        if (user.getRole() == UserRole.CLIENT) {
            customerServiceClient.createCustomerProfile(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhoneNumber()
            );
        }

        // Générer les tokens
        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Trouver l'utilisateur
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email ou mot de passe incorrect"));

        // Vérifier si le compte est actif
        if (!user.getIsActive()) {
            throw new BadCredentialsException("Compte désactivé");
        }

        // Vérifier le mot de passe
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            user.setFailedAttempts(user.getFailedAttempts() + 1);
            // Bloquer après 5 tentatives
            if (user.getFailedAttempts() >= 5) {
                user.setIsActive(false);
            }
            userRepository.save(user);
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }

        // Réinitialiser les tentatives échouées
        user.setFailedAttempts(0);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // Révoquer les anciens refresh tokens
        refreshTokenRepository.revokeAllByUserId(user.getId());

        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse refreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token invalide"));

        if (!refreshToken.isValid()) {
            throw new IllegalArgumentException("Refresh token expiré ou révoqué");
        }

        User user = refreshToken.getUser();

        // Révoquer l'ancien token
        refreshToken.setIsRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return generateAuthResponse(user);
    }

    @Transactional
    public void logout(String userId) {
        refreshTokenRepository.revokeAllByUserId(UUID.fromString(userId));
    }

    private AuthResponse generateAuthResponse(User user) {
        // Générer access token
        String accessToken = jwtService.generateToken(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );

        // Générer refresh token
        String refreshTokenValue = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshExpiration / 1000))
                .createdAt(LocalDateTime.now())
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpiration())
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .build();
    }
}
