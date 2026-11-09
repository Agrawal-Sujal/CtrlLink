package com.sunflower.ctrllink.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Value("${app.allowed-origin:http://localhost:3000}")
    private String allowedOrigin;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())     // Disable CSRF — we use JWT, not cookies
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // No sessions
                .authorizeHttpRequests(auth -> auth
                        // Public auth & documentation
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/actuator/health","/actuator/metrics/*").permitAll()

                        // Authenticated API endpoints (must precede generic wildcards)
                        .requestMatchers(HttpMethod.GET, "/api/v1/profile/me").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/v1/profile/settings").authenticated()
                        .requestMatchers("/api/v1/url/my-links", "/api/v1/url/tags", "/api/v1/url/reorder", "/api/v1/url/bulk-delete").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/url/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/url/**").authenticated()

                        // Public API endpoints
                        .requestMatchers(HttpMethod.POST, "/api/v1/url/shorten").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/url/stats/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/url/qr/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/url/resolve/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/portfolio/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/profile/**").permitAll()

                        // Public link redirection (root and nested folder paths)
                        .requestMatchers(HttpMethod.GET, "/{shortId}", "/{*path}").permitAll()
                        .requestMatchers(HttpMethod.HEAD, "/{shortId}", "/{*path}").permitAll()

                        // Everything else needs auth
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // Split allowedOrigin by comma and add each to allowed origins
        if (allowedOrigin != null && !allowedOrigin.isEmpty()) {
            String[] origins = allowedOrigin.split(",");
            for (String origin : origins) {
                config.addAllowedOriginPattern(origin.trim());
            }
        }
        
        // Always allow local development origins on any port
        config.addAllowedOriginPattern("http://localhost:*");
        config.addAllowedOriginPattern("http://localhost");
        config.addAllowedOriginPattern("http://127.0.0.1:*");
        config.addAllowedOriginPattern("http://127.0.0.1");
        
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true); // Recommended for JWT/Cookie flows
        config.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
