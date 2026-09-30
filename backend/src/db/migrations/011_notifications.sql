-- =============================================================================
-- Migration: 011_notifications.sql
-- Description: In-app notification system, user preference management,
--              and reusable notification templates
-- Platform: EDUK8U Work Placement Intelligence Platform
-- Author: DB Schema Agent
-- Created: 2026-06-04
-- Depends on: 001_tenancy_auth.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Notification Type Enum
-- Comprehensive domain event taxonomy for all notification scenarios
-- ---------------------------------------------------------------------------
CREATE TYPE notification_type AS ENUM (
  'placement_created',
  'placement_at_risk',
  'placement_completed',
  'hours_submitted',
  'hours_verified',
  'hours_rejected',
  'document_uploaded',
  'document_requires_signature',
  'document_signed',
  'agreement_requires_signature',
  'agreement_signed',
  'risk_flag_raised',
  'risk_flag_resolved',
  'compliance_alert',
  'audit_reminder',
  'supervisor_verification_required',
  'host_approval_required',
  'monitoring_visit_due',
  'placement_overdue',
  'system_alert',
  'general'
);

COMMENT ON TYPE notification_type IS
  'All notification event types in the EDUK8U platform. '
  'Each type maps to a template in notification_templates.';

-- ---------------------------------------------------------------------------
-- Notifications
-- Per-user notification inbox. High-volume table — indexed aggressively.
-- Old read notifications should be purged periodically (>90 days old).
-- ---------------------------------------------------------------------------
CREATE TABLE notifications (
  id          UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID               NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type  NOT NULL,
  title       VARCHAR(255)       NOT NULL,
  message     TEXT               NOT NULL,
  action_url  VARCHAR(500),
  entity_type VARCHAR(100),
  entity_id   UUID,
  priority    VARCHAR(20)        DEFAULT 'normal'
                                 CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read     BOOLEAN            DEFAULT false,
  read_at     TIMESTAMPTZ,
  is_emailed  BOOLEAN            DEFAULT false,
  emailed_at  TIMESTAMPTZ,
  email_failed BOOLEAN           DEFAULT false,
  metadata    JSONB              DEFAULT '{}',
  created_at  TIMESTAMPTZ        DEFAULT NOW()
);

COMMENT ON TABLE notifications IS
  'In-app notification inbox. Each row is one notification for one user. '
  'Email delivery status is tracked in is_emailed / email_failed columns.';
COMMENT ON COLUMN notifications.action_url IS
  'Relative URL the user should navigate to when clicking the notification';
COMMENT ON COLUMN notifications.entity_type IS
  'The entity this notification is about: "placement", "document", "risk_flag", etc.';
COMMENT ON COLUMN notifications.priority IS
  'Display urgency: "low" | "normal" | "high" | "urgent". Urgent triggers immediate email.';
COMMENT ON COLUMN notifications.metadata IS
  'Additional context for the notification: snapshot data, counts, thresholds, etc.';

-- ---------------------------------------------------------------------------
-- Notification Preferences
-- Per-user configuration for notification delivery channels and frequency
-- ---------------------------------------------------------------------------
CREATE TABLE notification_preferences (
  id                     UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id              UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id                UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_enabled          BOOLEAN      DEFAULT true,
  sms_enabled            BOOLEAN      DEFAULT false,
  in_app_enabled         BOOLEAN      DEFAULT true,
  email_digest_frequency VARCHAR(20)  DEFAULT 'immediate'
                                      CHECK (email_digest_frequency IN ('immediate', 'hourly', 'daily', 'weekly', 'never')),
  quiet_hours_start      TIME,
  quiet_hours_end        TIME,
  preferences            JSONB        DEFAULT '{}',
  created_at             TIMESTAMPTZ  DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(user_id)
);

COMMENT ON TABLE notification_preferences IS
  'User-level notification delivery preferences. One row per user.';
COMMENT ON COLUMN notification_preferences.email_digest_frequency IS
  'Batch email frequency: immediate (per event), hourly, daily, weekly, or never';
COMMENT ON COLUMN notification_preferences.quiet_hours_start IS
  'Start of do-not-disturb window (local time); emails and SMS are queued during this period';
COMMENT ON COLUMN notification_preferences.preferences IS
  'Per-type preferences: {notification_type: {email: bool, sms: bool, in_app: bool}}';

-- ---------------------------------------------------------------------------
-- Notification Templates
-- Reusable email/in-app message templates with variable interpolation.
-- Templates can be customised per tenant; global templates have tenant_id = NULL.
-- ---------------------------------------------------------------------------
CREATE TABLE notification_templates (
  id                UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID               REFERENCES tenants(id) ON DELETE CASCADE,
  template_key      VARCHAR(100)       NOT NULL,
  notification_type notification_type,
  subject           VARCHAR(500),
  body_html         TEXT,
  body_text         TEXT,
  variables         JSONB              DEFAULT '[]',
  is_active         BOOLEAN            DEFAULT true,
  created_at        TIMESTAMPTZ        DEFAULT NOW(),
  UNIQUE(tenant_id, template_key)
);

COMMENT ON TABLE notification_templates IS
  'Email and in-app message templates. tenant_id = NULL for system-level defaults; '
  'tenant-specific rows override system defaults for that RTO.';
COMMENT ON COLUMN notification_templates.template_key IS
  'Stable identifier matching notification_type, e.g. "placement_at_risk"';
COMMENT ON COLUMN notification_templates.body_html IS
  'HTML email body with Mustache/Handlebars variable syntax: {{variable_name}}';
COMMENT ON COLUMN notification_templates.body_text IS
  'Plain-text fallback for email clients that do not render HTML';
COMMENT ON COLUMN notification_templates.variables IS
  'Array of {name, description, required, example} variable definitions for the template';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_notifications_user     ON notifications(user_id);
CREATE INDEX idx_notifications_unread   ON notifications(user_id, is_read)
  WHERE is_read = false;
CREATE INDEX idx_notifications_tenant   ON notifications(tenant_id);
CREATE INDEX idx_notifications_created  ON notifications(created_at DESC);
CREATE INDEX idx_notifications_priority ON notifications(user_id, priority)
  WHERE is_read = false;
CREATE INDEX idx_notifications_pending_email ON notifications(is_emailed, email_failed, created_at)
  WHERE is_emailed = false AND email_failed = false;

CREATE INDEX idx_notif_prefs_user ON notification_preferences(user_id);

CREATE INDEX idx_notif_templates_type   ON notification_templates(notification_type)
  WHERE notification_type IS NOT NULL;
CREATE INDEX idx_notif_templates_tenant ON notification_templates(tenant_id)
  WHERE tenant_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
