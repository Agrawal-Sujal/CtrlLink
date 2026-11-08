package com.sunflower.ctrllink.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final JwtBlacklistService blacklistService;

    public JwtAuthenticationFilter(JwtService jwtService, JwtBlacklistService blacklistService) {
        this.jwtService = jwtService;
        this.blacklistService = blacklistService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. Extract the Authorization header
        String authHeader = request.getHeader("Authorization");

        // 2. If no token, let the request through (might be a public endpoint)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Extract and validate the token
        String token = authHeader.substring(7); // Remove "Bearer "

        try {
            boolean valid = jwtService.isTokenValid(token);
            boolean blacklisted = blacklistService.isTokenBlacklisted(token);

            if (valid && !blacklisted) {
                String email = jwtService.extractEmail(token);
                Long userId = jwtService.extractUserId(token);

                // Populate MDC userId for request correlation
                if (userId != null) {
                    MDC.put("userId", String.valueOf(userId));
                }

                // 4. Create an authentication object and set it in the context
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userId, null, List.of());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.debug("Authenticated user id={} email={}", userId, email);
            } else if (!valid) {
                log.debug("JWT rejected: Token is expired or invalid");
            } else {
                log.warn("JWT rejected: Token has been revoked / blacklisted");
            }
        } catch (Exception e) {
            log.warn("JWT validation error: {}", e.getMessage());
        }

        // 5. Continue to the next filter / controller
        filterChain.doFilter(request, response);
    }
}
