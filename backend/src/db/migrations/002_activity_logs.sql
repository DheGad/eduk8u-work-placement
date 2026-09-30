-- =============================================================================
-- Migration: 002_activity_logs.sql
-- Description: Activity logging and immutable audit trails for ASQA compliance
-- Platform: EDUK8U Work Placement Intelligence Platform
-- Author: DB Schema Agent
-- Created: 2026-06-04
-- Depends on: 001_tenancy_auth.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Action Enum — covers all domain events that must be auditable
-- ---------------------------------------------------------------------------
CREATE TYPE log_action AS ENUM (
  'created',
  'updated',
  'deleted',
  'viewed',
  'signed',
  'uploaded',
  'downloaded',
  'approved',
  'rejected',
  'submitted',
  'verified',
  'flagged',
  'resolved',
  'login',
  'logout',
  'password_reset',
  'role_changed'
);

COMMENT ON TYPE log_action IS 'Enumerated domain events used in activity_logs; extend as new actions are introduced';

-- ---------------------------------------------------------------------------
-- Activity Logs
-- High-volume append-only table recording all user-driven actions.
-- No UPDATE or DELETE should ever be issued against this table.
-- ---------------------------------------------------------------------------
CREATE TABLE activity_logs (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID         REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
  action      log_action   NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id   UUID,
  description TEXT         NOT NULL,
  details     JSONB        DEFAULT '{}',
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE activity_logs IS
  'Append-only activity log. Every significant user action is recorded here for '
  'compliance reporting, audit trails, and behavioural analytics.';
COMMENT ON COLUMN activity_logs.entity_type IS
  'Logical entity name, e.g. "placement", "student", "document"';
COMMENT ON COLUMN activity_logs.entity_id IS
  'UUID of the entity being acted upon; NULL for cross-entity or system actions';
COMMENT ON COLUMN activity_logs.details IS
  'Arbitrary JSON payload — contextual data specific to the action type';

-- ---------------------------------------------------------------------------
-- Audit Trails
-- Fine-grained field-level change history for ASQA audit traceability.
-- Records before/after values for every sensitive field mutation.
-- ---------------------------------------------------------------------------
CREATE TABLE audit_trails (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID         REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type     VARCHAR(100) NOT NULL,
  entity_id       UUID         NOT NULL,
  changed_by      UUID         REFERENCES users(id) ON DELETE SET NULL,
  change_type     VARCHAR(50)  NOT NULL,
  field_changed   VARCHAR(200),
  before_value    TEXT,
  after_value     TEXT,
  before_snapshot JSONB,
  after_snapshot  JSONB,
  ip_address      INET,
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE audit_trails IS
  'Immutable field-level change history. Captures before/after values for '
  'regulated entities to satisfy ASQA record-keeping requirements.';
COMMENT ON COLUMN audit_trails.change_type IS
  'Coarse operation type: INSERT | UPDATE | DELETE | STATUS_CHANGE | SIGNATURE';
COMMENT ON COLUMN audit_trails.field_changed IS
  'Column or logical field name that was mutated; NULL for whole-record operations';
COMMENT ON COLUMN audit_trails.before_snapshot IS
  'Full JSON snapshot of the record prior to change (for critical entities)';
COMMENT ON COLUMN audit_trails.after_snapshot IS
  'Full JSON snapshot of the record after change (for critical entities)';

-- ---------------------------------------------------------------------------
-- Indexes
-- Optimised for tenant-scoped reporting and per-entity history queries
-- ---------------------------------------------------------------------------
CREATE INDEX idx_activity_logs_tenant_id  ON activity_logs(tenant_id);
CREATE INDEX idx_activity_logs_user_id    ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity     ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action     ON activity_logs(tenant_id, action);

CREATE INDEX idx_audit_trails_entity    ON audit_trails(entity_type, entity_id);
CREATE INDEX idx_audit_trails_tenant_id ON audit_trails(tenant_id);
CREATE INDEX idx_audit_trails_changed_by ON audit_trails(changed_by);
CREATE INDEX idx_audit_trails_created_at ON audit_trails(created_at DESC);
