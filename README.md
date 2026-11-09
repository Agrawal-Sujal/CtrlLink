# CtrlLink

A modern, high-performance URL management, link shortening, and real-time telemetry platform built with **Spring Boot 4 (Java 21)**, **React 18 / Vite 5**, **PostgreSQL 16**, and **Redis 7**.

CtrlLink delivers sub-millisecond redirections, rich social previews, custom hierarchical folder paths, AES-encrypted link passwords, automated time-series click analytics, and dynamic QR code generation.

---

## Table of Contents

- [Overview](#overview)
- [Key Features & How to Use Them](#key-features--how-to-use-them)
  - [1. Lightning-Fast URL Shortening](#1-lightning-fast-url-shortening)
  - [2. Custom Aliases & Multi-Level Folder Paths](#2-custom-aliases--multi-level-folder-paths)
  - [3. Password-Protected Links & Access Checkpoints](#3-password-protected-links--access-checkpoints)
  - [4. Auto-Expiry & Link TTL](#4-auto-expiry--link-ttl)
  - [5. Real-Time Telemetry & Deep Click Analytics](#5-real-time-telemetry--deep-click-analytics)
  - [6. Dynamic QR Code Generator & PNG Export](#6-dynamic-qr-code-generator--png-export)
  - [7. Tagging System & Link Organization](#7-tagging-system--link-organization)
  - [8. Smart AI Title & Web Metadata Scraping](#8-smart-ai-title--web-metadata-scraping)
  - [9. Social Bot Detection & Rich OpenGraph Previews](#9-social-bot-detection--rich-opengraph-previews)
  - [10. User Authentication & Profile Management](#10-user-authentication--profile-management)
  - [11. Enterprise Reliability & High-Throughput Engine](#11-enterprise-reliability--high-throughput-engine)
- [Interactive API Documentation (Swagger / OpenAPI)](#interactive-api-documentation-swagger--openapi)
- [REST API Quick Reference](#rest-api-quick-reference)
- [Quick Start with Docker](#quick-start-with-docker)
- [Local Development (Hybrid Setup)](#local-development-hybrid-setup)
- [Configuration & Environment Variables](#configuration--environment-variables)
- [Architecture & Tech Stack](#architecture--tech-stack)

---

## Overview

CtrlLink is designed for teams, marketers, and developers who need more than a generic link shortener:
- **Instant Redirection (Zero-DB Hit on Hot Paths)**: Cached Redis hash entities serve requests with sub-millisecond latency.
- **Hierarchical Paths**: Organize short links under structured folders such as `/youtube/videos/programming` or `/docs/api/v1/auth`.
- **Zero-Contention ID Allocation**: In-memory Hi/Lo ID range allocator reduces database lock contention by 99%.
- **Actionable Telemetry**: Tracks click timelines, geographic distribution (with self-healing Geo-IP resolution), referrer sources, and browser/OS footprints.

---

## Key Features & How to Use Them

### 1. Lightning-Fast URL Shortening

Convert long, unwieldy URLs into clean, compact Base62-encoded links that redirect instantly with HTTP `302 Found`.

#### How to Use:
1. Navigate to the dashboard at [http://localhost:3000](http://localhost:3000).
2. Paste your long destination URL into the input field (click **Paste** to paste directly from your clipboard).
3. Click **Shorten Link**.
4. A success dialog opens immediately displaying your shortened URL, destination preview, and quick copy button.

---

### 2. Custom Aliases & Multi-Level Folder Paths

Brand your short links with custom keywords, or organize them hierarchically using up to 5 nested folder segments.

- **Root Custom Slugs**: e.g., `/launch-2026` or `/summer-sale`
- **Nested Folder Hierarchies**: e.g., `/youtube/tutorials/react-hooks` or `/products/shoes/sneakers`
- **Auto-Slug inside Folders**: Append a trailing slash (e.g., `/marketing/campaign/`) to automatically generate a unique short slug inside that folder.

#### How to Use:
1. On the dashboard, click **Link Options** below the shorten bar.
2. In the **Custom Alias or Folder Path** input, type your desired slug or folder path (e.g. `youtube/videos/spring-boot` or `spring-boot`).
3. Click **Shorten Link**.

---

### 3. Password-Protected Links & Access Checkpoints

Secure confidential links with passwords. When a protected link is accessed, the visitor is directed to a secure checkpoint asking for the password before granting access.

- Stored passwords are encrypted with AES-256 using `APP_ENCRYPTION_SECRET`.
- Owners can edit passwords or decrypt and view them at any time from their dashboard.

#### How to Use:
1. In the **Link Options** drawer, enter an access password in the **Password Protection** field (4–20 characters).
2. Click **Shorten Link**.
3. When visitors open the link, they are presented with a **Security Checkpoint** page (`/p/{path}`).
4. Entering the correct password unlocks the redirect and logs telemetry.
5. In your links table:
   - Click the **Edit** icon to change or remove a link's password.
   - Click a protected link to unlock and view the destination directly.

---

### 4. Auto-Expiry & Link TTL

Set automatic time-to-live expiration periods for temporary links (flash sales, time-sensitive tokens, seasonal promotions). Once expired, links immediately deactivate and return an HTTP `410 Gone` error.

#### How to Use:
1. Expand **Link Options** in the shorten box.
2. Under **Auto-Expiry**, select a preset duration:
   - **1 Day**
   - **7 Days**
   - **30 Days**
   - **90 Days**
   - **1 Year (365 Days)**
   - *Leave empty for a permanent link.*
3. Click **Shorten Link**. The link displays an active expiration badge in your table.

---

### 5. Real-Time Telemetry & Deep Click Analytics

CtrlLink captures high-fidelity telemetry for every click asynchronously (`@Async`) without blocking the redirection pipeline:
- **Velocity & Growth**: Real-time click volume and velocity rate (clicks/day).
- **Time-Series Charts**: Interactive area charts grouped by hour (for 24h view) or by day (for 7d / all-time view).
- **Geolocation Breakdown**: Country-level breakdown with interactive pie charts and percentage tables. Uses IP-API with a 7-day Redis cache and **Self-Healing Geo-IP reconciliation**.
- **Referrer Distribution**: Tracks traffic sources (Direct, Twitter/X, LinkedIn, Google, Facebook, Reddit, etc.).
- **Device & Browser Analytics**: Categorizes visitors by platform (Windows, macOS, Linux, iOS, Android) and browser (Chrome, Safari, Firefox, Edge, Opera).

#### How to Use:
1. On the dashboard, view high-level platform statistics in the top metric cards (**Total Links**, **Total Clicks**, **Protected Links**, **Avg Clicks/Link**).
2. Inspect the **Clicks by Short URL** bar chart to see your top-performing links at a glance.
3. In the links table, click the **Clicks** badge or the **BarChart icon** on any link row.
4. An analytics modal will open. Toggle between **24 Hours**, **7 Days**, and **All Time** to dynamically filter all visualizations.

---

### 6. Dynamic QR Code Generator & PNG Export

Generate crisp, high-resolution QR codes for physical flyers, business cards, presentations, and digital advertisements.

#### How to Use:
1. In the links table, click **Show URL** on any link row (or shorten a new link).
2. In the modal, click the **QR Code icon** to display the vector QR code.
3. Click **Download QR Code (PNG)** to save the high-res PNG file directly to your device (named `ctrllink-{shortId}-qr.png`).

---

### 7. Tagging System & Link Organization

Organize and categorize links using custom tags (e.g. `#marketing`, `#github`, `#social`, `#dev`).

#### How to Use:
1. **Assigning Tags**: When shortening or editing a link, type tag names into the **Tags** field and press Enter.
2. **Dashboard Quick Filter**: Use the tag pill bar above the links table to filter the list to only links bearing that tag.
3. **Dedicated Tag Manager**: Click **Manage all tags →** (or navigate to `/tags` in the top navigation):
   - View all registered tags and their link counts.
   - Search tags or sort by **Most Links** or **Alphabetical**.
   - Select a tag to see all associated links.
   - Assign tags to links directly from the tag management screen.

---

### 8. Smart AI Title & Web Metadata Scraping

CtrlLink can automatically visit destination pages in the background using Jsoup to extract page titles and meta descriptions, ensuring clean and recognizable links in your dashboard.

#### How to Use:
1. Before shortening a link, tick the **Smart AI Title Fetch** toggle.
2. If left blank, the application will scrape the destination website and format a clean, human-friendly title.
3. You can also manually provide a title in the **Title** input or edit an existing title at any time.

---

### 9. Social Bot Detection & Rich OpenGraph Previews

When a CtrlLink short link is shared in messaging apps or social networks (WhatsApp, Slack, Twitter/X, Discord, Telegram, Facebook, LinkedIn), CtrlLink detects the bot User-Agent and generates server-side OpenGraph and Twitter Card metadata:

- `og:title` & `twitter:title`
- `og:description` & `twitter:description`
- `og:url`
- Instant `<meta http-equiv="refresh">` fallback

This guarantees rich link previews with titles and thumbnails instead of bare short URLs.

---

### 10. User Authentication & Profile Management

CtrlLink features enterprise-ready authentication:
- **Local Email & Password**: Secure BCrypt hashing with email verification enforcement.
- **Google OAuth 2.0**: One-click Google Sign-In with server-side ID token validation.
- **Email Verification & Welcome Messages**: Automated email notifications via SMTP.
- **Password Reset Flow**: Tokenized password reset links sent via email.
- **JWT with Redis Blacklisting**: Stateless JWT tokens invalidated in Redis upon logout.
- **Profile Management**: Customize your display name and view account status on `/profile`.

#### How to Use:
- Sign up with your email or log in with Google at `/login`.
- Manage your account details or resend verification emails at `/profile`.
- Use the theme toggle in the navigation bar to switch between **Dark** and **Light** modes.

---

### 11. Enterprise Reliability & High-Throughput Engine

- **In-Memory Hi/Lo ID Range Allocator**: Dispenses Base62 counter IDs in batches from memory, eliminating DB sequence bottlenecks under heavy write spikes.
- **Atomic Redis Rate Limiter**: Uses atomic Lua scripts (`INCR` + `EXPIRE` in 1 RTT) with a **Fail-Open strategy** (if Redis experiences downtime, traffic is never dropped).
  - Shorten endpoint: 10 requests / min / IP
  - Login endpoint: 10 requests / min / IP
  - Register endpoint: 5 requests / min / IP
- **Startup Cache Warmup**: Automatically preloads the top 1,000 most-clicked links into Redis when the backend starts.
- **Distributed Analytics Sync**: A scheduled task running every 30 seconds acquires a distributed lock (`analytics:sync:lock`) and flushes buffered Redis click counters to PostgreSQL in atomic batches.
- **Correlation ID Tracking**: Every HTTP request receives an `X-Request-Id` header for end-to-end distributed tracing across frontend and backend logs.

---

## Interactive API Documentation (Swagger / OpenAPI)

CtrlLink includes comprehensive OpenAPI 3.0 specifications and a Swagger UI dashboard.

Once the backend is running, open:
- **Swagger UI**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- **OpenAPI JSON Docs**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

You can test every endpoint directly from the browser by clicking **Authorize** and supplying your Bearer JWT token.

---

## REST API Quick Reference

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new user account | No |
| `POST` | `/api/v1/auth/login` | Login with email & password | No |
| `POST` | `/api/v1/auth/google` | Login with Google OAuth ID token | No |
| `GET` | `/api/v1/auth/verify?token={token}` | Verify user email address | No |
| `POST` | `/api/v1/auth/resend-verification` | Resend verification email | No |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset email | No |
| `POST` | `/api/v1/auth/reset-password` | Confirm password reset with token | No |
| `POST` | `/api/v1/auth/logout` | Invalidate JWT (Redis blacklist) | Yes |

### URL Management (`/api/v1/url`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/url/shorten` | Create short link (custom alias/expiry/password/tags) | Optional (Required for verified features) |
| `GET` | `/api/v1/url/my-links` | List user links (with search, tag & pagination) | Yes |
| `GET` | `/api/v1/url/tags` | List distinct tags with link counts | Yes |
| `GET` | `/api/v1/url/stats/{shortId}` | Get deep click telemetry (`range=24h\|7d\|all`) | No |
| `GET` | `/api/v1/url/stats/public` | Get platform-wide link and click totals | No |
| `PATCH`| `/api/v1/url/{shortId}/metadata`| Update link title and password | Yes |
| `PATCH`| `/api/v1/url/{shortId}/tags` | Update link tags | Yes |
| `DELETE`| `/api/v1/url/{shortId}` | Permanently delete a short link | Yes |
| `POST` | `/api/v1/url/bulk-delete` | Bulk delete short links | Yes |
| `PUT` | `/api/v1/url/reorder` | Update display order index of links | Yes |
| `POST` | `/api/v1/url/resolve/{path}` | Verify password and unlock destination URL | No |
| `GET` | `/api/v1/url/{shortId}/reveal-password` | Retrieve decrypted password for owned link | Yes |

### Redirection & Previews (Root)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/{path}` | Instant 302 redirect, password challenge, or rich OG preview |

---

## Quick Start with Docker

Run the entire CtrlLink stack (PostgreSQL, Redis, Backend, and Frontend) with a single command:

```bash
docker compose up --build -d
```

### Services & Port Mappings
| Service | Technology | Container Port | Host URL / Port |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + Nginx | `80` | [http://localhost:3000](http://localhost:3000) |
| **Backend** | Spring Boot 4 (Java 21) | `8080` | [http://localhost:8080](http://localhost:8080) |
| **Swagger UI**| SpringDoc OpenAPI 3 | `8080` | [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html) |
| **PostgreSQL**| PostgreSQL 16 | `5432` | `localhost:5432` |
| **Redis** | Redis 7 | `6379` | `localhost:6379` |

### Health Check & Status
```bash
# Verify container status
docker compose ps

# Check backend actuator health
curl http://localhost:8080/actuator/health
```

### Viewing Logs
```bash
# Follow logs from all services
docker compose logs -f

# Follow specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Stopping the Stack
```bash
# Stop containers (preserves database and cache data)
docker compose down

# Stop and wipe persistent volumes (clean slate)
docker compose down -v
```

---

## Local Development (Hybrid Setup)

If you are developing features and want fast live-reloading:

1. **Start Database and Cache in Docker**:
   ```bash
   docker compose up -d postgres redis
   ```

2. **Run Backend** (Spring Boot 4 / Java 21):
   ```bash
   cd "CtrlLink - Backend"
   ./mvnw spring-boot:run
   ```

3. **Run Frontend** (React 18 / Vite 5):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The Vite dev server will start at `http://localhost:5173` (or `http://localhost:3000`).

---

## Configuration & Environment Variables

Copy `.env.example` to `.env` in the repository root and customize as needed:

```bash
cp .env.example .env
```

### Key Environment Variables Reference
| Variable | Default / Example | Purpose |
| :--- | :--- | :--- |
| `POSTGRES_DB` | `ctrllink_db` | PostgreSQL database name |
| `POSTGRES_USER` | `ctrllink_user` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `your_secret_password` | PostgreSQL password |
| `POSTGRES_PORT` | `5432` | Host port for PostgreSQL |
| `REDIS_HOST` | `redis` or Upstash host | Hostname for Redis (`redis` in Docker, `xxx.upstash.io` for Upstash) |
| `REDIS_PORT` | `6379` | Port for Redis |
| `REDIS_PASSWORD` | *(empty)* or Upstash password | Redis authentication password |
| `REDIS_USERNAME` | `default` | Redis ACL username |
| `REDIS_SSL_ENABLED` | `false` (or `true` for Upstash) | Whether to enable SSL/TLS for Redis connections |
| `APP_BASE_URL` | `http://localhost:8080` | Public base URL for generated short links |
| `APP_FRONTEND_URL` | `http://localhost:3000` | Frontend web URL for redirects and email links |
| `APP_ALLOWED_ORIGIN`| `http://localhost:3000` | CORS allowed origin |
| `APP_URL_ID_BATCH_SIZE`| `100` | In-memory ID range buffer size |
| `APP_JWT_SECRET` | `32+ char secret string`| Secret key used to sign JWT authentication tokens |
| `APP_JWT_EXPIRATION_MS`| `86400000` (24h) | JWT validity duration in milliseconds |
| `APP_ENCRYPTION_SECRET`| `32 char secret string`| AES-256 secret key for encrypting link passwords |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | Google OAuth 2.0 Web Client ID |
| `SPRING_MAIL_HOST` | `smtp.gmail.com` | SMTP host for email verification |
| `SPRING_MAIL_PORT` | `587` | SMTP port |
| `SPRING_MAIL_USERNAME`| `you@gmail.com` | SMTP user / Gmail address |
| `SPRING_MAIL_PASSWORD`| `app-specific-password`| SMTP app password |
| `LOGGING_LEVEL_APP` | `DEBUG` | Application logging level (`DEBUG`, `INFO`, `WARN`) |
| `VITE_API_BASE_URL` | `http://localhost:8080` | API base URL for frontend build |

---

## Architecture & Tech Stack

```
                   +-----------------------------------+
                   |   Web Clients & Mobile Browsers   |
                   +-----------------+-----------------+
                                     |
                                     v
                       +---------------------------+
                       |    Nginx Reverse Proxy    |
                       |    (Frontend React SPA)   |
                       +-------------+-------------+
                                     |
                                     v
                      +-----------------------------+
                      | Spring Boot 4 (Java 21 API) |
                      +--------------+--------------+
                                     |
                   +-----------------+-----------------+
                   |                                   |
                   v                                   v
        +--------------------+              +--------------------+
        |   PostgreSQL 16    |              |      Redis 7       |
        |  - Relational Data |              |  - L1/L2 Caching   |
        |  - Flyway Schemas  |              |  - Click Telemetry |
        |  - Hi/Lo Allocator |              |  - Token Blacklist |
        +--------------------+              |  - Rate Limiting   |
                                            +--------------------+
```

- **Backend**: Spring Boot 4.1.2, Java 21, Spring Security, Spring Data JPA, Hibernate, Flyway, JJWT, Jsoup, ZXing, SpringDoc OpenAPI.
- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS, Recharts, Lucide Icons, Canvas Confetti, Axios.
- **Data & Cache**: PostgreSQL 16 Alpine, Redis 7 Alpine.
- **Deployment**: Multi-stage Docker builds, Docker Compose orchestration, Nginx SPA routing.

---

## License

This project is licensed under the [MIT License](LICENSE).
