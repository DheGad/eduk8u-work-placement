-- =============================================================================
-- Migration: 017_saas_foundations.sql
-- Description: Subscriptions, drafts, and notifications
-- =============================================================================

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_name VARCHAR(50) UNIQUE NOT NULL,
  max_students INTEGER NOT NULL,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed plans
INSERT INTO subscription_plans (tier_name, max_students, features) VALUES
  ('starter', 50, '{"api_access": false, "custom_branding": false}'),
  ('professional', 250, '{"api_access": true, "custom_branding": true}'),
  ('enterprise', 999999, '{"api_access": true, "custom_branding": true, "sso": true}')
ON CONFLICT (tier_name) DO NOTHING;

CREATE TABLE placement_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  current_step INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  compliance_alerts BOOLEAN DEFAULT true,
  placement_alerts BOOLEAN DEFAULT true
);
