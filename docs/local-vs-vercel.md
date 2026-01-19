# Local vs Vercel Behaviour

## Local

- SQLite stored at `./.data/sustain.db` (default)
- Uploads stored at `./storage/uploads/`
- Data persists across restarts

## Vercel (Demo)

Vercel serverless functions have an **ephemeral filesystem**.

- SQLite is stored at `/tmp/sustain.db`
- Uploads are stored at `/tmp/uploads/`
- Data may persist within a warm instance but is **not guaranteed** and will not persist across deploys

This repo still deploys (and works for demos), but it is not a production persistence strategy.

## Production recommendation

- Use Postgres (managed) for primary DB
- Store files in S3 / Azure Blob / GCS, with signed URLs
- Keep the same domain model and RBAC logic; only swap the storage adapters
