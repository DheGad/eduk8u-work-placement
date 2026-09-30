-- =============================================================================
-- Migration: 007_user_approval_and_notifications.sql
-- Description: User approval workflow, notification centre, and org settings
-- =============================================================================

-- 1. Add approval_status to users
CREATE TYPE user_approval_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

ALTER TABLE users
ADD COLUMN approval_status user_approval_status DEFAULT 'approved';

-- Set existing users to approved
UPDATE users SET approval_status = 'approved';



-- 3. Organisation Settings
CREATE TABLE organisation_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  branding_logo_url TEXT,
  branding_primary_color VARCHAR(7) DEFAULT '#4f46e5',
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  lms_integration_enabled BOOLEAN DEFAULT false,
  lms_type VARCHAR(50),
  lms_api_key TEXT,
  lms_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_org_settings_updated_at
  BEFORE UPDATE ON organisation_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
