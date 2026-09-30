-- =============================================================================
-- Migration: 013_automation_engine.sql
-- Description: Dynamic Event-Based Workflow Automation Engine
-- Platform: EDUK8U Work Placement Intelligence Platform
-- Author: Phase 8 Agent
-- Created: 2026-06-04
-- =============================================================================

CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_event VARCHAR(100) NOT NULL, -- e.g., 'HOURS_SUBMITTED', 'PLACEMENT_CREATED'
  conditions JSONB DEFAULT '[]',       -- Array of condition objects
  actions JSONB NOT NULL,              -- Array of action objects
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
  trigger_event VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'success', 'error'
  execution_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automation_rules_tenant ON automation_rules(tenant_id);
CREATE INDEX idx_automation_rules_event ON automation_rules(trigger_event, is_enabled);
CREATE INDEX idx_automation_logs_entity ON automation_logs(entity_type, entity_id);

CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
