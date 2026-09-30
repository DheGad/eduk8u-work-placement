-- =============================================================================
-- Migration: 003_workflow_engine.sql
-- Description: Data-driven workflow engine supporting multiple course types
--              without code changes — new courses get new workflow definitions
-- Platform: EDUK8U Work Placement Intelligence Platform
-- Author: DB Schema Agent
-- Created: 2026-06-04
-- Depends on: 001_tenancy_auth.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Workflow Definitions
-- Top-level definition for a placement workflow, bound to a course code.
-- Each RTO (tenant) can have its own customised workflow for the same course.
-- ---------------------------------------------------------------------------
CREATE TABLE workflow_definitions (
  id                   UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id            UUID         REFERENCES tenants(id) ON DELETE CASCADE,
  name                 VARCHAR(255) NOT NULL,
  course_code          VARCHAR(50)  NOT NULL,
  description          TEXT,
  total_hours_required INTEGER      NOT NULL DEFAULT 120,
  version              INTEGER      NOT NULL DEFAULT 1,
  is_active            BOOLEAN      DEFAULT true,
  config               JSONB        DEFAULT '{}',
  created_by           UUID         REFERENCES users(id),
  created_at           TIMESTAMPTZ  DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE workflow_definitions IS
  'Top-level workflow blueprint bound to a course code. A tenant may maintain '
  'multiple versions; only one should be is_active=true per course_code per tenant.';
COMMENT ON COLUMN workflow_definitions.course_code IS
  'AVETMISS-aligned training package code, e.g. CHC33021';
COMMENT ON COLUMN workflow_definitions.total_hours_required IS
  'Minimum placement hours mandated by the training package for this course';
COMMENT ON COLUMN workflow_definitions.version IS
  'Monotonically increasing version for change management; new version = new row';
COMMENT ON COLUMN workflow_definitions.config IS
  'Arbitrary JSON for feature flags, conditional logic, notification settings, etc.';

-- ---------------------------------------------------------------------------
-- Workflow Steps
-- Ordered list of phases within a workflow definition.
-- step_key is the stable reference used in code; step_name can be localised.
-- ---------------------------------------------------------------------------
CREATE TABLE workflow_steps (
  id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_definition_id  UUID         NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  step_order              INTEGER      NOT NULL,
  step_key                VARCHAR(100) NOT NULL,
  step_name               VARCHAR(255) NOT NULL,
  step_description        TEXT,
  is_required             BOOLEAN      DEFAULT true,
  required_documents      JSONB        DEFAULT '[]',
  required_signatures     JSONB        DEFAULT '[]',
  required_forms          JSONB        DEFAULT '[]',
  config                  JSONB        DEFAULT '{}',
  created_at              TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(workflow_definition_id, step_key)
);

COMMENT ON TABLE workflow_steps IS
  'Ordered phases within a workflow definition. Each step has a stable key used '
  'in application logic, plus declarative lists of required documents and signatures.';
COMMENT ON COLUMN workflow_steps.step_key IS
  'Stable machine-readable identifier; never change after launch (used in FK refs)';
COMMENT ON COLUMN workflow_steps.step_order IS
  'Display/execution order; lower numbers run first';
COMMENT ON COLUMN workflow_steps.required_documents IS
  'Array of {form_code, label, is_mandatory} objects declaring required docs for this step';
COMMENT ON COLUMN workflow_steps.required_signatures IS
  'Array of {signer_role, label} objects declaring required signatures for this step';
COMMENT ON COLUMN workflow_steps.required_forms IS
  'Array of form_code strings for digital forms that must be completed at this step';
COMMENT ON COLUMN workflow_steps.config IS
  'Step-level configuration: auto_complete rules, notifications, SLA hours, etc.';

-- ---------------------------------------------------------------------------
-- Workflow Transitions
-- Directed edges in the workflow graph.
-- Supports both sequential (manual) and conditional (rule-based) transitions.
-- ---------------------------------------------------------------------------
CREATE TABLE workflow_transitions (
  id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_definition_id  UUID         NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  from_step_key           VARCHAR(100) NOT NULL,
  to_step_key             VARCHAR(100) NOT NULL,
  condition_type          VARCHAR(50)  DEFAULT 'manual',
  condition_config        JSONB        DEFAULT '{}',
  created_at              TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE workflow_transitions IS
  'Directed transitions between workflow steps. Supports manual and rule-based '
  'advancement (e.g. auto-advance when all required documents are signed).';
COMMENT ON COLUMN workflow_transitions.condition_type IS
  'Transition trigger: manual | auto | conditional | scheduled';
COMMENT ON COLUMN workflow_transitions.condition_config IS
  'JSON rules evaluated by the workflow engine to determine eligibility for this transition';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_workflow_definitions_tenant       ON workflow_definitions(tenant_id);
CREATE INDEX idx_workflow_definitions_course_active ON workflow_definitions(tenant_id, course_code, is_active);
CREATE INDEX idx_workflow_steps_definition          ON workflow_steps(workflow_definition_id);
CREATE INDEX idx_workflow_steps_order               ON workflow_steps(workflow_definition_id, step_order);
CREATE INDEX idx_workflow_transitions_definition    ON workflow_transitions(workflow_definition_id);
CREATE INDEX idx_workflow_transitions_from          ON workflow_transitions(workflow_definition_id, from_step_key);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER update_workflow_def_updated_at
  BEFORE UPDATE ON workflow_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
