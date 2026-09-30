-- =============================================================================
-- Migration: 006_students.sql
-- Description: Student enrolment, pre-placement readiness (CA0398),
--              and learner information packs (LS0013)
-- Platform: EDUK8U Work Placement Intelligence Platform
-- Author: DB Schema Agent
-- Created: 2026-06-04
-- Depends on: 001_tenancy_auth.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE readiness_status AS ENUM (
  'not_started',
  'in_progress',
  'ready',
  'not_ready',
  'deferred'
);

COMMENT ON TYPE readiness_status IS
  'Pre-placement readiness assessment outcome for a student (CA0398)';

-- ---------------------------------------------------------------------------
-- Students
-- Learners enrolled in a course that includes a work placement component
-- ---------------------------------------------------------------------------
CREATE TABLE students (
  id                             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                      UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id                        UUID         REFERENCES users(id) ON DELETE SET NULL,
  student_number                 VARCHAR(50),
  ussi                           VARCHAR(10),
  first_name                     VARCHAR(100) NOT NULL,
  last_name                      VARCHAR(100) NOT NULL,
  preferred_name                 VARCHAR(100),
  email                          VARCHAR(255) NOT NULL,
  phone                          VARCHAR(20),
  date_of_birth                  DATE,
  gender                         VARCHAR(20),
  address_line1                  VARCHAR(255),
  address_line2                  VARCHAR(255),
  suburb                         VARCHAR(100),
  state                          VARCHAR(3),
  postcode                       VARCHAR(4),
  country                        VARCHAR(50)  DEFAULT 'Australia',
  emergency_contact_name         VARCHAR(255),
  emergency_contact_phone        VARCHAR(20),
  emergency_contact_relationship VARCHAR(100),
  course_code                    VARCHAR(50)  DEFAULT 'CHC33021',
  course_name                    VARCHAR(255) DEFAULT 'Certificate III in Individual Support',
  enrolment_date                 DATE,
  expected_completion_date       DATE,
  trainer_id                     UUID         REFERENCES users(id),
  is_active                      BOOLEAN      DEFAULT true,
  notes                          TEXT,
  metadata                       JSONB        DEFAULT '{}',
  created_by                     UUID         REFERENCES users(id),
  created_at                     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at                     TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(tenant_id, student_number),
  CONSTRAINT chk_enrolment_dates CHECK (
    enrolment_date IS NULL OR expected_completion_date IS NULL
    OR enrolment_date <= expected_completion_date
  )
);

COMMENT ON TABLE students IS
  'Learners enrolled in courses with a mandatory work placement component. '
  'student_number is the RTO''s internal identifier; ussi is the national AVETMISS identifier.';
COMMENT ON COLUMN students.ussi IS
  'Unique Student Identifier (USI) — 10-character national student identifier';
COMMENT ON COLUMN students.course_code IS
  'Training package qualification code, e.g. CHC33021 (Cert III Individual Support)';
COMMENT ON COLUMN students.trainer_id IS
  'Assigned trainer/assessor responsible for this student''s placement';
COMMENT ON COLUMN students.metadata IS
  'Flexible JSON for course-specific attributes, disability support needs, language background, etc.';

-- ---------------------------------------------------------------------------
-- CA 0398: Pre-Placement Learner Readiness Assessment
-- Verifies the student has all required clearances, certifications, and
-- prerequisite training before commencing placement
-- ---------------------------------------------------------------------------
CREATE TABLE pre_placement_readiness (
  id                         UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                  UUID             NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id                 UUID             NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  form_code                  VARCHAR(20)      DEFAULT 'CA0398',
  assessed_by                UUID             REFERENCES users(id),
  assessment_date            DATE,
  -- Police Check
  police_check_status        VARCHAR(50),
  police_check_date          DATE,
  police_check_expiry        DATE,
  police_check_document_id   UUID,
  -- Working With Children Check
  wwcc_status                VARCHAR(50),
  wwcc_number                VARCHAR(50),
  wwcc_expiry                DATE,
  wwcc_document_id           UUID,
  -- First Aid
  first_aid_status           VARCHAR(50),
  first_aid_cert_number      VARCHAR(50),
  first_aid_expiry           DATE,
  first_aid_document_id      UUID,
  -- Prerequisite training completions
  infection_control_completed BOOLEAN         DEFAULT false,
  manual_handling_completed  BOOLEAN          DEFAULT false,
  food_safety_completed      BOOLEAN          DEFAULT false,
  -- Full checklist items
  checklist_items            JSONB            DEFAULT '{}',
  overall_status             readiness_status DEFAULT 'not_started',
  approved_by                UUID             REFERENCES users(id),
  approved_at                TIMESTAMPTZ,
  notes                      TEXT,
  document_id                UUID,
  created_at                 TIMESTAMPTZ      DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ      DEFAULT NOW()
);

COMMENT ON TABLE pre_placement_readiness IS
  'CA0398 — Pre-placement learner readiness checklist. Verifies all mandatory '
  'clearances (police check, WWCC) and prerequisites before placement commencement.';
COMMENT ON COLUMN pre_placement_readiness.police_check_status IS
  'E.g. "clear", "conditions_apply", "not_yet_submitted", "pending"';
COMMENT ON COLUMN pre_placement_readiness.wwcc_status IS
  'WWCC verification status: "verified", "expired", "not_required", "pending"';
COMMENT ON COLUMN pre_placement_readiness.checklist_items IS
  'JSON map of {item_key: {label, status, evidence_doc_id, notes}} for all line items';

-- ---------------------------------------------------------------------------
-- LS0013: Learner Information Pack Acknowledgement
-- Records that the student has received and acknowledged the placement info pack
-- ---------------------------------------------------------------------------
CREATE TABLE learner_info_packs (
  id                          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id                  UUID         NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  form_code                   VARCHAR(20)  DEFAULT 'LS0013',
  issued_by                   UUID         REFERENCES users(id),
  issued_at                   TIMESTAMPTZ  DEFAULT NOW(),
  delivery_method             VARCHAR(50),
  student_acknowledged_at     TIMESTAMPTZ,
  student_acknowledgement_ip  INET,
  student_signature_data      TEXT,
  document_id                 UUID,
  notes                       TEXT,
  created_at                  TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE learner_info_packs IS
  'LS0013 — Learner Information Pack issuance and acknowledgement record. '
  'Proves the student was given all required pre-placement information.';
COMMENT ON COLUMN learner_info_packs.delivery_method IS
  'How the pack was delivered: "email" | "in_person" | "portal" | "post"';
COMMENT ON COLUMN learner_info_packs.student_signature_data IS
  'Base64-encoded SVG or PNG of the student''s electronic signature';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_students_tenant  ON students(tenant_id);
CREATE INDEX idx_students_trainer ON students(trainer_id);
CREATE INDEX idx_students_course  ON students(course_code);
CREATE INDEX idx_students_active  ON students(tenant_id, is_active);
CREATE INDEX idx_students_ussi    ON students(ussi) WHERE ussi IS NOT NULL;

CREATE INDEX idx_ppr_student  ON pre_placement_readiness(student_id);
CREATE INDEX idx_ppr_status   ON pre_placement_readiness(overall_status);
CREATE INDEX idx_ppr_tenant   ON pre_placement_readiness(tenant_id);

CREATE INDEX idx_lip_student ON learner_info_packs(student_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ppr_updated_at
  BEFORE UPDATE ON pre_placement_readiness
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
