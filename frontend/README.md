# CtrlLink Frontend

Modern, high-performance URL shortener and link analytics web application for **CtrlLink** (Smart URL Shortener and Digital Identity Platform).

Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, **Recharts**, and **@react-oauth/google**.

---

## Features

### 1. Dedicated URL Shortener Experience (`/`)
- **Homepage & Main Workspace**:
  - Direct shortener interface: paste any destination long URL, customize alias, password protection, expiration, and tags.
  - Auto-title and AI categorization toggle.
  - Generates instant 302 redirect links matching backend `app.base-url` (`http://localhost:8080/{shortId}`).
- **"Show URL" Pop-up Dialog**:
  - Displays the shortened URL with instant 1-click clipboard copy.
  - Displays the original long URL with 1-click copy and direct test link.
  - Quick action button to view real-time link analytics.
- **Click Performance Bar Chart**:
  - Built with Recharts for both Light and Dark themes.
  - **X-axis**: Short URLs / Titles.
  - **Y-axis**: Click counts.
- **My Links List & Management**:
  - Search links by title, alias, long URL, or tags.
  - Actions: **Show URL**, **View Analytics**, **Edit Title & Tags**, **Delete**, and **Open Link**.

---

### 2. Deep URL Analytics & Insights
- Triggered by clicking on any link's click count, date, or analytics button.
- **3 Time-Range Filters**:
  - **All Time** (`range="all"`)
  - **7 Days** (`range="7d"`)
  - **24 Hours** (`range="24h"`)
- **Key Metrics**:
  - Total Clicks
  - Last Click timestamp
  - Created Date
  - Range Growth (average clicks per day)
- **Visualizations**:
  - **Click Activity Frequency**: Area chart plotting interaction frequency across the selected time range.
  - **Geo Distribution**: Interactive Pie Chart displaying clicks by country (`countries`).
  - **Referral Sources**: Interactive Pie Chart displaying traffic source domains (`referrers`).
  - **Device / Browser Distribution**: Interactive Pie Chart displaying platforms and browsers (`devices`).

---

### 3. Password Protection & Smart Redirection
- **Public Redirection Route (`/:shortId` and `/r/:shortId`)**:
  - Instantly hands off to backend redirect endpoint (`http://localhost:8080/{shortId}`) with zero intermediate splash or loading delays.
- **Password Challenge Page (`/p/:shortId`)**:
  - Destination for password-protected links.
  - Secure unlock prompt calling `POST /api/v1/url/resolve/{shortId}`.
  - Automatically redirects `window.location.href` to original long URL upon verification.

---

### 4. Clean Profile Settings (`/profile`)
- Clean, standard web profile settings card.
- User display name update (`POST /api/v1/profile/settings`).
- Profile photo upload with instant preview (`POST /api/v1/profile/picture`).
- Notice: If the user's email is not verified, displays **"Email verification remaining"** with a one-click "Resend verification email" action.

---

### 5. Theme Support
- Full **Dark Mode** & **Light Mode** toggle.
- Preserves user choice in `localStorage`.
- Prominently accessible in the top navigation bar across all pages.

---

## Backend Endpoint Mapping

| Action | Endpoint | Method | Request Payload / Params |
|---|---|---|---|
| Create Short URL | `/api/v1/url/shorten` | `POST` | `ShortenRequestDto` |
| Get My Links | `/api/v1/url/my-links` | `GET` | `search`, `page`, `size` |
| Get URL Stats | `/api/v1/url/stats/{shortId}` | `GET` | `range=all\|7d\|24h` |
| Update Metadata | `/api/v1/url/{shortId}/metadata` | `PATCH` | `{ title, password }` |
| Update Tags | `/api/v1/url/{shortId}/tags` | `PATCH` | `{ tags }` |
| Delete URL | `/api/v1/url/{shortId}` | `DELETE` | Path parameter |
| Resolve Password | `/api/v1/url/resolve/{shortId}` | `POST` | `{ password }` |
| Redirect / OG Tags | `/{shortId}` | `GET` | Redirects to longUrl or `/p/{shortId}` |
| Get Profile | `/api/v1/profile/me` | `GET` | `Authorization: Bearer <token>` |
| Update Profile | `/api/v1/profile/settings` | `POST` | `{ name }` |
| Upload Profile Photo | `/api/v1/profile/picture` | `POST` | `multipart/form-data` (`file`) |
| Resend Verification | `/api/v1/auth/resend-verification` | `POST` | `{ email }` |
| Register | `/api/v1/auth/register` | `POST` | `{ name, email, password }` |
| Login | `/api/v1/auth/login` | `POST` | `{ email, password }` |
| Google OAuth | `/api/v1/auth/google` | `POST` | `{ idToken }` |
| Logout | `/api/v1/auth/logout` | `POST` | `Authorization: Bearer <token>` |

---

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on **`http://localhost:3000`** with proxying to backend on `http://localhost:8080`.
