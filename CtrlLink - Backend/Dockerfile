# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copy pom.xml and cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests

# ── Stage 2: Runtime ───────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Run as non-root user for security
RUN addgroup -S ctrllink && adduser -S ctrllink -G ctrllink

# Copy executable jar from builder stage
COPY --from=builder --chown=ctrllink:ctrllink /build/target/ctrllink-0.0.1-SNAPSHOT.jar app.jar

# Default environment variables matching application.properties
ENV POSTGRES_HOST=postgres \
    POSTGRES_PORT=5432 \
    POSTGRES_DB=CtrlLink \
    POSTGRES_USER=admin \
    POSTGRES_PASSWORD=admin \
    REDIS_HOST=redis \
    REDIS_PORT=6379 \
    APP_BASE_URL=http://localhost:8080 \
    APP_FRONTEND_URL=http://localhost:3000 \
    APP_ALLOWED_ORIGIN=http://localhost:3000 \
    APP_URL_ID_BATCH_SIZE=100 \
    APP_JWT_SECRET=my-super-secret-key-that-is-at-least-256-bits-long-for-hs256 \
    APP_JWT_EXPIRATION_MS=86400000 \
    APP_ENCRYPTION_SECRET=my-ultra-secret-key-32-chars-long \
    GOOGLE_CLIENT_ID=671534648137-qi5mvbmdf3paikng3stn3dnosv2bv3rs.apps.googleusercontent.com \
    SPRING_MAIL_HOST=smtp.gmail.com \
    SPRING_MAIL_PORT=587 \
    SPRING_MAIL_USERNAME="" \
    SPRING_MAIL_PASSWORD=""

USER ctrllink

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=30s \
  CMD wget --no-verbose --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
