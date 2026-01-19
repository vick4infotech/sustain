# Data Model (SQLite)

This MVP uses SQLite with explicit, minimal tables.

## Core entities

### users
- **id** (PK)
- **email** (unique)
- **role**: `ADMIN | TALENT | COMPANY | DONOR`
- **status**: `active | pending | suspended`
- **password_hash**: PBKDF2 format string (server-only)

### sessions
Stores session records for cookie-based auth:
- **session_hash**: HMAC(session_id)
- **csrf_token**: random per-session string
- **expires_at**
- **revoked_at**

### auth_tokens
Invite tokens (admin-created accounts):
- **token_hash**: SHA-256(invite_token)
- **type**: `INVITE`
- **expires_at**, **used_at**

### talent_profiles (LinkedIn-style)
A structured, CV-like profile used for search and matching:
- `full_name`, `headline`, `about`
- `location_country`, `location_city`
- `languages`, `interests`
- `profile_visibility` (for compliance)

Sub-tables:
- `talent_skills` (normalized)
- `talent_experiences`
- `talent_education`
- `talent_certifications`
- `talent_links`

### company_profiles
Minimal employer profile:
- `company_name`, `sector`, `website`, `hq_location`

### training_modules & training_items
Training content owned by admins. Items can be:
- lecture (text)
- video (URL or uploaded)
- document (uploaded)

### talent_item_progress
Completion tracking:
- composite key `(talent_user_id, training_item_id)`
- status (`completed`)

### opportunities & applications
Employer engagement + placement tracking:
- companies post `opportunities`
- talents create `applications`
- company updates application status

### messages
Simple internal messaging.

### audit_events
Append-only action logging for audit readiness.

## Access boundaries (high-level)
- **Admin**: full read/write
- **Talent**: can edit own profile; read published training; apply to opportunities
- **Company**: can read compliant talent view; post opportunities; update their own application pipelines
- **Donor**: read-only aggregate reporting only
