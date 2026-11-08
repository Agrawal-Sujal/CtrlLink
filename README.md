# CtrlLink

A modern, high-performance URL management, link shortening, and real-time analytics platform built with **Spring Boot 4 (Java 21)**, **React 18 / Vite 5**, **PostgreSQL 16**, and **Redis 7**.

---

## Quick Start with Docker (Automated Full Stack)

Run the entire CtrlLink stack (PostgreSQL, Redis, Backend, and Frontend) with a single Docker Compose command:

```bash
docker compose up --build -d
```

### Services & Port Mappings
| Service | Technology | Port | URL |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + Nginx | `3000` | [http://localhost:3000](http://localhost:3000) |
| **Backend** | Spring Boot 4 (Java 21) | `8080` | [http://localhost:8080](http://localhost:8080) |
| **PostgreSQL** | PostgreSQL 16 | `5432` | `localhost:5432` |
| **Redis** | Redis 7 | `6379` | `localhost:6379` |

### Health Check & Service Status
Verify all containers are up and healthy:
```bash
docker compose ps
```

Check backend application health:
```bash
curl http://localhost:8080/actuator/health
```

### Viewing Logs
```bash
# View logs from all services
docker compose logs -f

# View logs from a specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Stopping the Stack
```bash
# Stop containers (preserves database and cache volumes)
docker compose down

# Stop and remove volumes (clean reset)
docker compose down -v
```

---

## Local Development (Hybrid Mode via IDEs)

If you prefer developing locally with your IDE and live-reloading:

1. **Start only the Database and Cache in Docker**:
   ```bash
   docker compose up -d postgres redis
   ```

2. **Run Backend** (via your IDE or terminal):
   ```bash
   cd "CtrlLink - Backend"
   ./mvnw spring-boot:run
   ```

3. **Run Frontend** (via your IDE or terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

The application is pre-configured with fallback defaults to connect to `localhost:5432` and `localhost:6379` automatically when run outside Docker.

---

## Configuration

Custom environment variables can be configured by copying `.env.example` to `.env`:

```bash
cp .env.example .env
```
