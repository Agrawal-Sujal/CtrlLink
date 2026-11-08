package com.sunflower.ctrllink.auth.service;

import com.sunflower.ctrllink.auth.dto.AuthResponseDto;
import com.sunflower.ctrllink.auth.dto.LoginRequestDto;
import com.sunflower.ctrllink.auth.dto.RegisterRequestDto;
import com.sunflower.ctrllink.auth.entity.PasswordResetTokenEntity;
import com.sunflower.ctrllink.auth.entity.VerificationTokenEntity;
import com.sunflower.ctrllink.auth.repository.PasswordResetTokenRepository;
import com.sunflower.ctrllink.auth.repository.VerificationTokenRepository;
import com.sunflower.ctrllink.exception.BadRequestException;
import com.sunflower.ctrllink.exception.ConflictException;
import com.sunflower.ctrllink.security.JwtService;
import com.sunflower.ctrllink.user.entity.UserEntity;
import com.sunflower.ctrllink.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import java.util.Collections;
import java.util.Optional;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String googleClientId;
    private final VerificationTokenRepository verificationTokenRepo;
    private final PasswordResetTokenRepository passwordResetTokenRepo;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       @Value("${app.google.client-id}") String googleClientId,
                       VerificationTokenRepository verificationTokenRepo,
                       PasswordResetTokenRepository passwordResetTokenRepo,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleClientId = googleClientId;
        this.verificationTokenRepo = verificationTokenRepo;
        this.passwordResetTokenRepo = passwordResetTokenRepo;
        this.emailService = emailService;
    }

    public AuthResponseDto register(RegisterRequestDto request) {
        log.info("Processing registration for email={}", request.getEmail());
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration rejected: email={} is already registered", request.getEmail());
            throw new ConflictException("Email already registered");
        }

        // Create user with hashed password
        UserEntity user = new UserEntity();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // BCrypt hash
        user.setName(request.getName());
        userRepository.save(user);

        // Send verification email
        VerificationTokenEntity verificationToken = new VerificationTokenEntity();
        verificationToken.setUser(user);
        verificationTokenRepo.save(verificationToken);
        emailService.sendVerificationEmail(user.getEmail(), verificationToken.getToken());

        log.info("User registered successfully: userId={}, email={}", user.getId(), user.getEmail());
        // Generate JWT and return
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponseDto(token, user.getEmail(), user.getName());
    }

    public AuthResponseDto login(LoginRequestDto request) {
        log.info("Processing login for email={}", request.getEmail());
        // Find user by email
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed: account not found for email={}", request.getEmail());
                    return new BadRequestException("Invalid email or password");
                });

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Login failed: incorrect password for email={}", request.getEmail());
            throw new BadRequestException("Invalid email or password");
        }

        log.info("User logged in successfully: userId={}, email={}", user.getId(), user.getEmail());
        // Generate JWT and return
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponseDto(token, user.getEmail(), user.getName());
    }

    public AuthResponseDto googleLogin(String idTokenString) {
        try {
            // Verify the Google ID token
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new BadRequestException("Invalid Google ID token");
            }

            // Extract user info from Google token
            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            // Find existing user or create new one
            UserEntity user;
            Optional<UserEntity> existingUser = userRepository.findByEmail(email);

            if (existingUser.isEmpty()) {
                UserEntity newUser = new UserEntity();
                newUser.setEmail(email);
                newUser.setName(name != null ? name : email);
                newUser.setAuthProvider("GOOGLE");
                newUser.setEmailVerified(true); // Google OAuth implies verified email
                user = userRepository.save(newUser);

                // Send Welcome Email to first-time Google users
                emailService.sendGoogleWelcomeEmail(user.getEmail(), user.getName());
            } else {
                user = existingUser.get();
                // If the user existed but wasn't verified, verify them now and send welcome
                if (!user.isEmailVerified()) {
                    user.setEmailVerified(true);
                    userRepository.save(user);
                    emailService.sendWelcomeEmail(user.getEmail(), user.getName());
                }
            }

            // Generate our JWT and return
            String token = jwtService.generateToken(user.getId(), user.getEmail());
            return new AuthResponseDto(token, user.getEmail(), user.getName());

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Google authentication failed");
        }
    }

    public String verifyEmail(String token) {
        log.info("Processing email verification token");
        VerificationTokenEntity vToken = verificationTokenRepo.findByToken(token)
                .orElseThrow(() -> {
                    log.warn("Email verification failed: token not found");
                    return new BadRequestException("Invalid verification token");
                });

        if (vToken.isExpired()) {
            log.warn("Email verification failed: token expired");
            throw new BadRequestException("Verification token has expired");
        }

        UserEntity user = vToken.getUser();

        // Prevent duplicate Welcome Emails if user clicks the link multiple times
        if (user.isEmailVerified()) {
            // Delete the consumed token to keep DB clean
            verificationTokenRepo.delete(vToken);
            log.debug("User id={} email={} was already verified", user.getId(), user.getEmail());
            return "Email is already verified!";
        }

        user.setEmailVerified(true);
        userRepository.save(user);

        // Delete the consumed token so it can't be reused
        verificationTokenRepo.delete(vToken);

        // Dispatch Welcome Email asynchronously
        emailService.sendWelcomeEmail(user.getEmail(), user.getName());
        log.info("User id={} email={} verified successfully", user.getId(), user.getEmail());

        return "Email verified successfully!";
    }

    public void resendVerificationEmail(String email) {
        log.info("Resending verification email to {}", email);
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (user.isEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }

        // Professional Cleanup: Delete any old pending tokens for this user
        verificationTokenRepo.deleteByUser(user);

        // Generate a fresh token
        VerificationTokenEntity newToken = new VerificationTokenEntity();
        newToken.setUser(user);
        verificationTokenRepo.save(newToken);

        // Dispatch email
        emailService.sendVerificationEmail(user.getEmail(), newToken.getToken());
        log.info("Dispatched new verification email to {}", email);
    }

    public String requestPasswordReset(String email) {
        log.info("Processing password reset request for {}", email);
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("No account found with that email"));

        if ("GOOGLE".equals(user.getAuthProvider())) {
            log.warn("Password reset rejected: user is a Google OAuth account ({})", email);
            throw new BadRequestException("Google accounts cannot reset password. Use Google login.");
        }

        PasswordResetTokenEntity resetToken = new PasswordResetTokenEntity();
        resetToken.setUser(user);
        passwordResetTokenRepo.save(resetToken);
        emailService.sendPasswordResetEmail(user.getEmail(), resetToken.getToken());
        log.info("Dispatched password reset token to {}", email);

        return "Password reset email sent!";
    }

    public String resetPassword(String token, String newPassword) {
        log.info("Processing password reset confirmation");
        PasswordResetTokenEntity resetToken = passwordResetTokenRepo.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid reset token"));

        if (resetToken.isExpired()) {
            log.warn("Password reset failed: token expired");
            throw new BadRequestException("Reset token has expired");
        }
        if (resetToken.isUsed()) {
            log.warn("Password reset failed: token already used");
            throw new BadRequestException("Reset token has already been used");
        }

        UserEntity user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepo.save(resetToken);
        log.info("Password reset successfully completed for userId={}", user.getId());

        return "Password reset successfully!";
    }
}
