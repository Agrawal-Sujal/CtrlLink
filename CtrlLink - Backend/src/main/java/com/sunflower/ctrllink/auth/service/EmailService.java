package com.sunflower.ctrllink.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    private final String baseUrl;
    private final String frontendUrl;
    private final String mailUsername;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.base-url}") String baseUrl,
                        @Value("${app.frontend-url}") String frontendUrl,
                        @Value("${spring.mail.username:noreply.CtrlLink@gmail.com}") String mailUsername) {
        this.mailSender = mailSender;
        this.baseUrl = baseUrl;
        this.frontendUrl = frontendUrl;
        this.mailUsername = mailUsername;
    }

    @Async
    public void sendVerificationEmail(String to, String token) {
        log.info("Sending verification email to {}", to);
        String link = baseUrl + "/api/v1/auth/verify?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailUsername);
        message.setTo(to);
        message.setSubject("CtrlLink - Verify your email");
        message.setText("Click the link below to verify your email:\n\n" + link
                + "\n\nThis link expires in 24 hours.");
        sendSafe(message, to, "Verification Email");
    }

    @Async
    public void sendPasswordResetEmail(String to, String token) {
        log.info("Sending password reset email to {}", to);
        String link = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailUsername);
        message.setTo(to);
        message.setSubject("CtrlLink - Reset your password");
        message.setText("Click the link below to reset your password:\n\n" + link
                + "\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.");
        sendSafe(message, to, "Password Reset Email");
    }

    @Async
    public void sendWelcomeEmail(String to, String name) {
        log.info("Sending welcome email to {}", to);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailUsername);
        message.setTo(to);
        message.setSubject("Welcome to CtrlLink! 🎉");
        message.setText("Hi " + name + ",\n\n"
                + "Thank you for verifying your email address! Your CtrlLink account is now fully active.\n\n"
                + "The CtrlLink Team");
        sendSafe(message, to, "Welcome Email");
    }

    @Async
    public void sendGoogleWelcomeEmail(String to, String name) {
        log.info("Sending Google welcome email to {}", to);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailUsername);
        message.setTo(to);
        message.setSubject("Welcome to CtrlLink! 🎉");
        message.setText("Hi " + name + ",\n\n"
                + "Welcome aboard! You have successfully registered for CtrlLink using your Google account.\n\n"
                + "The CtrlLink Team");
        sendSafe(message, to, "Google Welcome Email");
    }

    private void sendSafe(SimpleMailMessage message, String to, String emailType) {
        try {
            mailSender.send(message);
            log.info("{} sent successfully to {}", emailType, to);
        } catch (Exception e) {
            log.error("Failed to send {} to {}: {}", emailType, to, e.getMessage(), e);
        }
    }
}
