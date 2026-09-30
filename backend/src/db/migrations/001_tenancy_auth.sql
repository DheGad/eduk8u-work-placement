-- =============================================================================
-- Migration: 001_tenancy_auth.sql
-- Description: Core tenancy, user authentication, and session management
-- Platform: EDUK8U Work Placement Intelligence Platform
-- Author: DB Schema Agent
-- Created: 2026-06-04
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tenants (RTOs)
-- Each row represents one Registered Training Organisation
-- ---------------------------------------------------------------------------
CREATE TABLE tenants (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(255) NOT NULL,
  slug              VARCHAR(100) UNIQUE NOT NULL,
  abn               VARCHAR(11),
  rto_code          VARCHAR(20),
  subscription_tier VARCHAR(50)  DEFAULT 'starter'
                                 CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
  is_active         BOOLEAN      DEFAULT true,
  settings          JSONB        DEFAULT '{}',
  contact_email     VARCHAR(255),
  contact_phone     VARCHAR(20),
  address           TEXT,
  logo_url          TEXT,
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE tenants IS 'Registered Training Organisations — top-level tenancy boundary for all data';
COMMENT ON COLUMN tenants.slug IS 'URL-safe unique identifier used in subdomains and routes';
COMMENT ON COLUMN tenants.abn IS 'Australian Business Number (11 digits, no spaces)';
COMMENT ON COLUMN tenants.rto_code IS 'ASQA-issued RTO registration code';
COMMENT ON COLUMN tenants.subscription_tier IS 'Billing tier: starter | professional | enterprise';

-- ---------------------------------------------------------------------------
-- User Role Enum
-- ---------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'college_admin',
  'trainer',
  'student',
  'supervisor',
  'host_manager',
  'auditor'
);

COMMENT ON TYPE user_role IS 'RBAC roles for the EDUK8U platform; super_admin has cross-tenant access';

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                     UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id              UUID         REFERENCES tenants(id) ON DELETE CASCADE,
  email                  VARCHAR(255) NOT NULL,
  password_hash          VARCHAR(255) NOT NULL,
  first_name             VARCHAR(100) NOT NULL,
  last_name              VARCHAR(100) NOT NULL,
  role                   user_role    NOT NULL,
  phone                  VARCHAR(20),
  profile_photo_url      TEXT,
  is_active              BOOLEAN      DEFAULT true,
  is_email_verified      BOOLEAN      DEFAULT false,
  email_verified_at      TIMESTAMPTZ,
  last_login_at          TIMESTAMPTZ,
  last_login_ip          INET,
  failed_login_attempts  INTEGER      DEFAULT 0,
  locked_until           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ  DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

COMMENT ON TABLE users IS 'Platform users — scoped to a tenant except super_admin (null tenant_id)';
COMMENT ON COLUMN users.tenant_id IS 'NULL only for super_admin role; all other roles must have a tenant';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hash — never store plaintext';
COMMENT ON COLUMN users.failed_login_attempts IS 'Reset to 0 on successful login; triggers lock after 5 attempts';
COMMENT ON COLUMN users.locked_until IS 'Account locked until this timestamp after excessive failed attempts';

-- Super admins have no tenant — enforce uniqueness on email for that subset
CREATE UNIQUE INDEX users_super_admin_email_idx
  ON users(email)
  WHERE tenant_id IS NULL;

-- ---------------------------------------------------------------------------
-- User Sessions (Refresh Tokens)
-- Access tokens are stateless JWTs; refresh tokens are stored here
-- ---------------------------------------------------------------------------
CREATE TABLE user_sessions (
  id                 UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
  ip_address         INET,
  user_agent         TEXT,
  is_revoked         BOOLEAN      DEFAULT false,
  expires_at         TIMESTAMPTZ  NOT NULL,
  created_at         TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE user_sessions IS 'Persisted refresh-token store; access tokens validated independently as JWTs';
COMMENT ON COLUMN user_sessions.refresh_token_hash IS 'SHA-256 hash of the raw refresh token — raw token is never stored';

-- ---------------------------------------------------------------------------
-- Email Verification Tokens
-- ---------------------------------------------------------------------------
CREATE TABLE email_verification_tokens (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ  NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE email_verification_tokens IS 'Single-use tokens for email address verification; invalidated on use or expiry';

-- ---------------------------------------------------------------------------
-- Password Reset Tokens
-- ---------------------------------------------------------------------------
CREATE TABLE password_reset_tokens (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ  NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE password_reset_tokens IS 'Single-use tokens for password reset flow; 1 hour TTL recommended';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_users_tenant_id   ON users(tenant_id);
CREATE INDEX idx_users_email        ON users(email);
CREATE INDEX idx_users_role         ON users(role);
CREATE INDEX idx_users_is_active    ON users(tenant_id, is_active);

CREATE INDEX idx_user_sessions_user_id    ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_revoked    ON user_sessions(user_id, is_revoked)
  WHERE is_revoked = false;

CREATE INDEX idx_email_verify_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);

-- ---------------------------------------------------------------------------
-- updated_at auto-update trigger function (shared across all migrations)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS
  'Generic BEFORE UPDATE trigger to auto-set updated_at to current timestamp';

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
