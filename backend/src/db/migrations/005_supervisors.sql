-- =============================================================================
-- Migration: 005_supervisors.sql
-- Description: Supervisor management — verification, experience records,
--              and briefing records (CA0395, CA0401)
-- Platform: EDUK8U Work Placement Intelligence Platform
-- Author: DB Schema Agent
-- Created: 2026-06-04
-- Depends on: 001_tenancy_auth.sql, 004_host_facilities.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE supervisor_status AS ENUM (
  'pending_verification',
  'verified',
  'rejected',
  'suspended'
);

CREATE TYPE briefing_status AS ENUM (
  'not_started',
  'in_progress',
  'completed'
);

COMMENT ON TYPE supervisor_status IS
  'Verification lifecycle for placement supervisors at host facilities';
COMMENT ON TYPE briefing_status IS
  'Completion status for supervisor briefing (CA0401)';

-- ---------------------------------------------------------------------------
-- Supervisors
-- Individuals at host facilities who directly supervise students on placement
-- ---------------------------------------------------------------------------
CREATE TABLE supervisors (
  id                    UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID                NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id               UUID                REFERENCES users(id) ON DELETE SET NULL,
  host_facility_id      UUID                NOT NULL REFERENCES host_facilities(id) ON DELETE CASCADE,
  first_name            VARCHAR(100)        NOT NULL,
  last_name             VARCHAR(100)        NOT NULL,
  email                 VARCHAR(255)        NOT NULL,
  phone                 VARCHAR(20),
  position_title        VARCHAR(255),
  department            VARCHAR(255),
  qualification_status  supervisor_status   DEFAULT 'pending_verification',
  briefing_status       briefing_status     DEFAULT 'not_started',
  years_experience      INTEGER,
  is_active             BOOLEAN             DEFAULT true,
  notes                 TEXT,
  created_by            UUID                REFERENCES users(id),
  created_at            TIMESTAMPTZ         DEFAULT NOW(),
  updated_at            TIMESTAMPTZ         DEFAULT NOW(),
  CONSTRAINT chk_years_experience CHECK (years_experience IS NULL OR years_experience >= 0)
);

COMMENT ON TABLE supervisors IS
  'Individuals nominated by host facilities to supervise students on placement. '
  'Must be verified (CA0395) and briefed (CA0401) before a student can commence.';
COMMENT ON COLUMN supervisors.user_id IS
  'Optional link to a platform user account — supervisors may use the portal directly';
COMMENT ON COLUMN supervisors.qualification_status IS
  'Verification outcome — must be "verified" before the supervisor can sign off competencies';

-- ---------------------------------------------------------------------------
-- CA 0395: Supervisor Qualification / Verification Records
-- RTOs must verify that supervisors hold appropriate qualifications
-- per Standards for RTOs 2015 Clause 1.4
-- ---------------------------------------------------------------------------
CREATE TABLE supervisor_qualifications (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supervisor_id       UUID         NOT NULL REFERENCES supervisors(id) ON DELETE CASCADE,
  form_code           VARCHAR(20)  DEFAULT 'CA0395',
  qualification_name  VARCHAR(255) NOT NULL,
  qualification_code  VARCHAR(100),
  qualification_level VARCHAR(100),
  issuing_body        VARCHAR(255),
  year_obtained       INTEGER,
  expiry_date         DATE,
  is_current          BOOLEAN      DEFAULT true,
  document_id         UUID,
  verified_at         TIMESTAMPTZ,
  verified_by         UUID         REFERENCES users(id),
  verification_notes  TEXT,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT chk_qual_year CHECK (
    year_obtained IS NULL OR (year_obtained >= 1950 AND year_obtained <= EXTRACT(YEAR FROM NOW()) + 1)
  )
);

COMMENT ON TABLE supervisor_qualifications IS
  'CA0395 — Qualification and credential records for placement supervisors. '
  'Each supervisor may hold multiple qualifications; the RTO must verify at least one.';
COMMENT ON COLUMN supervisor_qualifications.qualification_level IS
  'AQF level or equivalent, e.g. "AQF Level 5", "Registered Nurse Division 1"';
COMMENT ON COLUMN supervisor_qualifications.document_id IS
  'FK to documents.id for the uploaded credential/certificate copy';

-- ---------------------------------------------------------------------------
-- Supervisor Experience Records
-- Supports verification of relevant industry experience
-- beyond formal qualifications
-- ---------------------------------------------------------------------------
CREATE TABLE supervisor_experience_records (
  id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supervisor_id           UUID         NOT NULL REFERENCES supervisors(id) ON DELETE CASCADE,
  employer_name           VARCHAR(255),
  role_title              VARCHAR(255),
  start_date              DATE,
  end_date                DATE,
  is_current              BOOLEAN      DEFAULT false,
  responsibilities        TEXT,
  relevant_to_placement   BOOLEAN      DEFAULT true,
  verified_at             TIMESTAMPTZ,
  verified_by             UUID         REFERENCES users(id),
  created_at              TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT chk_exp_dates CHECK (
    start_date IS NULL OR end_date IS NULL OR is_current = true OR start_date <= end_date
  )
);

COMMENT ON TABLE supervisor_experience_records IS
  'Employment history records for supervisors, used to validate relevant industry experience '
  'when formal qualifications alone are insufficient.';

-- ---------------------------------------------------------------------------
-- CA 0401: Supervisor Guide & Briefing Record
-- Documents that the supervisor has been briefed on their obligations,
-- student assessment requirements, WHS, and emergency procedures
-- ---------------------------------------------------------------------------
CREATE TABLE supervisor_briefings (
  id                                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                             UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supervisor_id                         UUID         NOT NULL REFERENCES supervisors(id) ON DELETE CASCADE,
  form_code                             VARCHAR(20)  DEFAULT 'CA0401',
  briefed_by                            UUID         REFERENCES users(id),
  briefing_date                         DATE,
  briefing_method                       VARCHAR(100),
  topics_covered                        JSONB        DEFAULT '[]',
  supervisor_obligations_explained      BOOLEAN      DEFAULT false,
  assessment_requirements_explained     BOOLEAN      DEFAULT false,
  emergency_procedures_explained        BOOLEAN      DEFAULT false,
  whs_requirements_explained            BOOLEAN      DEFAULT false,
  acknowledgement_signed_at             TIMESTAMPTZ,
  acknowledgement_ip                    INET,
  document_id                           UUID,
  notes                                 TEXT,
  created_at                            TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE supervisor_briefings IS
  'CA0401 — Supervisor Guide briefing record. Documents that the trainer/assessor '
  'has briefed the supervisor on all obligations prior to student commencement.';
COMMENT ON COLUMN supervisor_briefings.briefing_method IS
  'Delivery mode: "face_to_face" | "phone" | "video_call" | "online" | "written"';
COMMENT ON COLUMN supervisor_briefings.topics_covered IS
  'Array of {topic_key, label, covered} objects for all briefing agenda items';
COMMENT ON COLUMN supervisor_briefings.acknowledgement_signed_at IS
  'Timestamp when supervisor electronically acknowledged understanding of CA0401';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_supervisors_tenant    ON supervisors(tenant_id);
CREATE INDEX idx_supervisors_host      ON supervisors(host_facility_id);
CREATE INDEX idx_supervisors_status    ON supervisors(qualification_status);
CREATE INDEX idx_supervisors_active    ON supervisors(tenant_id, is_active);

CREATE INDEX idx_supervisor_quals_supervisor ON supervisor_qualifications(supervisor_id);
CREATE INDEX idx_supervisor_quals_current    ON supervisor_qualifications(supervisor_id, is_current) WHERE is_current = true;

CREATE INDEX idx_supervisor_exp_supervisor ON supervisor_experience_records(supervisor_id);

CREATE INDEX idx_supervisor_briefings_supervisor ON supervisor_briefings(supervisor_id);
CREATE INDEX idx_supervisor_briefings_tenant     ON supervisor_briefings(tenant_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER update_supervisors_updated_at
  BEFORE UPDATE ON supervisors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
