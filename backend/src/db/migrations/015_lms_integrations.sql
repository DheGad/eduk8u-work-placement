-- =============================================================================
-- Migration: 015_lms_integrations.sql
-- Description: Integration mapping for Moodle and eSkilled
-- =============================================================================

CREATE TABLE lms_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  platform_name VARCHAR(50) NOT NULL, -- 'moodle', 'eskilled'
  base_url TEXT NOT NULL,
  api_key VARCHAR(255),
  client_id VARCHAR(255),
  client_secret VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lms_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID REFERENCES lms_integrations(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL, -- 'users', 'courses', 'enrollments'
  status VARCHAR(20) NOT NULL, -- 'success', 'failed'
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE users ADD COLUMN external_user_id VARCHAR(255);
ALTER TABLE workflow_definitions ADD COLUMN external_course_id VARCHAR(255);

CREATE INDEX idx_lms_external_user ON users(external_user_id);
