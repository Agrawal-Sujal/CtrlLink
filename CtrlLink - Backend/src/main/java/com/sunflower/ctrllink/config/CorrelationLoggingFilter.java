package com.sunflower.ctrllink.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter that establishes correlation IDs (X-Request-ID) in SLF4J MDC
 * for every incoming HTTP request and logs request/response lifecycles.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(CorrelationLoggingFilter.class);

    public static final String REQUEST_ID_HEADER = "X-Request-ID";
    public static final String MDC_REQUEST_ID = "requestId";
    public static final String MDC_CLIENT_IP = "clientIp";
    public static final String MDC_METHOD = "method";
    public static final String MDC_URI = "uri";
    public static final String MDC_USER_ID = "userId";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        long startTime = System.currentTimeMillis();

        // 1. Resolve or generate Request ID
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        // 2. Resolve Client IP (handling forwarders/proxies like Nginx)
        String clientIp = resolveClientIp(request);
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String queryString = request.getQueryString();
        String fullPath = queryString != null ? uri + "?" + queryString : uri;

        // 3. Populate MDC
        MDC.put(MDC_REQUEST_ID, requestId);
        MDC.put(MDC_CLIENT_IP, clientIp);
        MDC.put(MDC_METHOD, method);
        MDC.put(MDC_URI, uri);

        // 4. Mirror Request ID to response header for client correlation
        response.setHeader(REQUEST_ID_HEADER, requestId);

        boolean isActuator = uri.startsWith("/actuator");

        if (!isActuator) {
            log.info("--> HTTP {} {} [ip={}]", method, fullPath, clientIp);
        } else {
            log.trace("--> HTTP {} {} [ip={}]", method, fullPath, clientIp);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            int status = response.getStatus();

            if (!isActuator) {
                if (status >= 500) {
                    log.error("<-- HTTP {} {} - status={} ({}ms)", method, uri, status, duration);
                } else if (status >= 400) {
                    log.warn("<-- HTTP {} {} - status={} ({}ms)", method, uri, status, duration);
                } else {
                    log.info("<-- HTTP {} {} - status={} ({}ms)", method, uri, status, duration);
                }
            } else {
                log.trace("<-- HTTP {} {} - status={} ({}ms)", method, uri, status, duration);
            }

            // Always clear MDC to prevent leaking state to reuse pooled threads
            MDC.clear();
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
