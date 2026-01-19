# System Architecture

This repository is a single deployable Next.js 16 project that includes:

- **UI (App Router)** for all role dashboards
- **Node.js server runtime** via Next.js route handlers (`app/api/*`)
- A **thin, explicit backend layer** (`/api`) that owns business logic, authorization decisions, and data access
- **SQLite** for MVP persistence (`/db`)

## High-level data flow

1. User submits a form (SSR HTML form posts)
2. Next route handler validates session + CSRF, enforces RBAC
3. Route handler calls backend domain logic (`/api/*`)
4. Domain logic queries SQLite (`/db/connection.ts`)
5. Response redirects back to a dashboard page

## Layering rules

- `/app/**` (UI) must **never** embed secrets or compute password hashes client-side
- `/api/**` (domain) is `server-only` and is allowed to:
  - read env vars
  - access SQLite
  - enforce authorization
- `/db/**` contains:
  - migrations
  - DB connection + initialization

## Session handling

- Cookie name: `sid` (configurable)
- Cookie value: a random session identifier
- Stored in DB: **HMAC hash** of the session ID, plus a per-session CSRF token
- All non-idempotent routes require CSRF token

## File storage

- Local: `storage/uploads/`
- Vercel demo: `/tmp/uploads/` (ephemeral)
- Files are stored on disk and referenced from SQLite (`file_assets`)

Production replacement: S3 / Azure Blob / Vercel Blob with signed URLs.
