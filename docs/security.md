# Security & Compliance Notes (MVP)

This system is designed to be **audit-ready by default**, within MVP constraints.

## Authentication

- **Session-based** authentication (cookie)
- Password hashes computed **server-side only** (PBKDF2)
- No passwords are hard-coded; password setup is via:
  - Talent self-signup
  - Admin-generated invite link (for admin/company/donor accounts)
  - Optional bootstrap admin via env vars (first run only)

## Authorization

Role-based access control is enforced in two places:

1. **Route handlers** (write operations) via `requireSession([...roles])`
2. **Server-rendered pages** (read operations) via `requireSession([...roles])`

In addition, **object-level checks** are enforced, for example:
- A company can only update applications for its own opportunities
- Talents can only mark their own training progress
- Donors are read-only

## CSRF

Because the app uses cookie sessions, state-changing endpoints require a CSRF token:
- Token stored server-side in the session record
- Token submitted via hidden form field `csrfToken`

## Audit trail

Sensitive operations record an audit event:
- user creation / status changes
- content creation / file uploads
- opportunity creation / application status updates
- report exports

Audit events are intentionally append-only.

## Privacy & "limited talent profiles"

Company views use **projected profile data**:
- No email addresses are exposed
- Display name may be anonymized if `profile_visibility` is disabled
- The system can be adapted to more stringent anonymization policies (deferred)

## Known MVP constraints

- SQLite + local file storage is not a production-grade persistence strategy for serverless hosting
- This MVP avoids external storage dependencies to keep the system reviewable
