PRAGMA foreign_keys = ON;

-- Tracks which migrations have been applied.
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Users + roles
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN','TALENT','COMPANY','DONOR')),
  password_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','suspended')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Sessions (server-side)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_hash TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- One-time tokens for invite / password setup
CREATE TABLE IF NOT EXISTS auth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('invite','reset')),
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);

-- Talent profile (LinkedIn-like structure, non-social)
CREATE TABLE IF NOT EXISTS talent_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  headline TEXT,
  about TEXT,
  location_country TEXT,
  location_city TEXT,
  languages TEXT,
  experience_summary TEXT,
  interests TEXT,
  profile_visibility INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS talent_skills (
  talent_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (talent_user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS talent_experiences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  talent_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  organisation TEXT NOT NULL,
  location TEXT,
  start_month TEXT,
  end_month TEXT,
  is_current INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_talent_experiences_talent ON talent_experiences(talent_user_id);

CREATE TABLE IF NOT EXISTS talent_education (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  talent_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT,
  field TEXT,
  start_year INTEGER,
  end_year INTEGER,
  description TEXT
);

CREATE INDEX IF NOT EXISTS idx_talent_education_talent ON talent_education(talent_user_id);

CREATE TABLE IF NOT EXISTS talent_certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  talent_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT,
  issue_year INTEGER,
  expires_year INTEGER
);

CREATE INDEX IF NOT EXISTS idx_talent_certifications_talent ON talent_certifications(talent_user_id);

CREATE TABLE IF NOT EXISTS talent_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  talent_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_talent_links_talent ON talent_links(talent_user_id);

-- Company profile
CREATE TABLE IF NOT EXISTS company_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  sector TEXT,
  website TEXT,
  hq_location TEXT,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Training
CREATE TABLE IF NOT EXISTS training_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_by_admin_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS file_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  checksum TEXT NOT NULL,
  uploaded_by_user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS training_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lecture','video','document')),
  title TEXT NOT NULL,
  body_text TEXT,
  content_url TEXT,
  file_asset_id INTEGER REFERENCES file_assets(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_training_items_module ON training_items(module_id);

CREATE TABLE IF NOT EXISTS talent_item_progress (
  talent_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  training_item_id INTEGER NOT NULL REFERENCES training_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('not_started','in_progress','completed')),
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (talent_user_id, training_item_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_talent ON talent_item_progress(talent_user_id);

-- Opportunities + applications
CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  is_remote INTEGER NOT NULL DEFAULT 0,
  requirements_text TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft','open','closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  talent_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','shortlisted','interview','offer','hired','rejected','withdrawn')),
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  status_updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  hired_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_talent ON applications(talent_user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Messaging (async inbox)
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_user_id);

-- Audit trail
CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata_json TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action);
