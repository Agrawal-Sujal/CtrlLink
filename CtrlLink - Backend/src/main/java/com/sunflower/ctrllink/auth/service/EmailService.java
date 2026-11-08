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
        log.debug("sendVerificationEmail to {} token: {}", to, token);
        String link = baseUrl + "/api/v1/auth/verify?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailUsername);
        message.setTo(to);
        message.setSubject("CtrlLink - Verify your email");
        message.setText("Click the link below to verify your email:\n\n" + link
                + "\n\nThis link expires in 24 hours.");
        mailSender.send(message);
    }

    @Async
    public void sendPasswordResetEmail(String to, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailUsername);
        message.setTo(to);
        message.setSubject("CtrlLink - Reset your password");
        message.setText("Click the link below to reset your password:\n\n" + link
                + "\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.");
        mailSender.send(message);
    }

    @Async
    public void sendWelcomeEmail(String to, String name) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailUsername);
        message.setTo(to);
        message.setSubject("Welcome to CtrlLink! 🎉");
        message.setText("Hi " + name + ",\n\n"
                + "Thank you for verifying your email address! Your CtrlLink account is now fully active.\n\n"
                + "The CtrlLink Team");
        mailSender.send(message);
    }

    @Async
    public void sendGoogleWelcomeEmail(String to, String name) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailUsername);
        message.setTo(to);
        message.setSubject("Welcome to CtrlLink! 🎉");
        message.setText("Hi " + name + ",\n\n"
                + "Welcome aboard! You have successfully registered for CtrlLink using your Google account.\n\n"
                + "The CtrlLink Team");
        mailSender.send(message);
    }
}
