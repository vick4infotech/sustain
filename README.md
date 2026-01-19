# SUSTAIN Platform (MVP)

A compliance-aware, donor-trust-first talent mobility + training platform.

- **Stack:** Next.js 16 (App Router) + Node.js runtime + SQLite
- **Auth:** Session-based (cookie) + role-based access control
- **Roles:** Admin, Talent, Company, Donor (read-only)

> This is an MVP built for local running and Vercel demo deployment. SQLite and file uploads on Vercel are intentionally treated as **ephemeral demo storage**.

## 1) Local setup

### Prerequisites
- Node.js **20.9+**
- npm

### Install
```bash
npm install
```

### Environment
Copy env example:
```bash
cp .env.example .env.local
```

At minimum, set a strong session secret:
```
SESSION_SECRET=replace_with_a_long_random_value
```

### Optional: bootstrap the first admin (recommended)
If there is **no** admin yet, the system can create one automatically on the first login attempt.

In `.env.local`:
```
BOOTSTRAP_ADMIN_EMAIL=admin@example.org
BOOTSTRAP_ADMIN_PASSWORD=choose_a_strong_password
```

> The bootstrap variables are **read only on the server** and are never shipped to the frontend. Remove them after first admin creation.

### Database migration
The app auto-applies migrations when it first touches the DB. You can also run:
```bash
npm run db:migrate
```

### Run
```bash
npm run dev
```
Then open:
- Login: `http://localhost:3000/login`
- Talent signup: `http://localhost:3000/signup`

## 2) Password handling rules
- Passwords are never hard-coded.
- Password hashing is server-side PBKDF2.
- Admins **do not set** other users’ passwords.

### Talent password
Talents set their password at sign-up.

### Company / Donor / additional Admin passwords
1. Admin creates the user in **Admin → Users**
2. Admin clicks **Generate invite link**
3. Admin sends the invite link via email/chat (manual process in MVP)
4. Recipient sets their password through the invite page

## 3) Vercel deployment (demo)

This project deploys as a standard Next.js app.

### Important limitations (MVP)
- Vercel serverless filesystem is **ephemeral**.
- SQLite is stored in `/tmp/sustain.db` during runtime.
- Uploaded files are stored in `/tmp/uploads/`.

For a real production deployment:
- Replace SQLite with Postgres (e.g., managed database)
- Store files on S3 / Vercel Blob / Azure

### Required environment variables on Vercel
- `SESSION_SECRET`

Optional:
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD`

## 4) Common workflows

### Admin
- Create users (Talent/Company/Donor)
- Create training modules + items (lectures, video links, documents)
- Review dashboards + export impact CSV
- View audit log

### Talent
- Build a LinkedIn-style profile (skills, experience, education)
- Complete training items and track progress
- View opportunities and apply
- Receive messages

### Company
- Post opportunities
- Review applicants and update status
- Search talent profiles (visibility-limited)
- Message Admin / applicants

### Donor
- View aggregate dashboards
- Download impact report CSV

## 5) What is intentionally NOT built (MVP)
- Automated email sending
- Password reset flows
- Real-time chat
- External SSO (Google/Microsoft)
- Full M&E survey tooling

See `/docs` for architecture, security, data model, and local vs Vercel notes.
