-- =============================================================================
-- Migration: 008_hours_evidence.sql
-- Description: Hour logging (LR0353), daily journals, evidence uploads,
--              competency sign-offs, and monitoring visit records
-- Platform: EDUK8U Work Placement Intelligence Platform
-- Author: DB Schema Agent
-- Created: 2026-06-04
-- Depends on: 001_tenancy_auth.sql, 005_supervisors.sql,
--             006_students.sql, 007_placements.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE hour_verification_status AS ENUM (
  'pending',
  'verified',
  'rejected'
);

CREATE TYPE evidence_review_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'needs_revision'
);

CREATE TYPE competency_status AS ENUM (
  'not_assessed',
  'satisfactory',
  'not_yet_satisfactory',
  'not_applicable'
);

COMMENT ON TYPE hour_verification_status IS
  'Supervisor verification state for a daily hour log entry';
COMMENT ON TYPE evidence_review_status IS
  'Trainer review state for submitted evidence items';
COMMENT ON TYPE competency_status IS
  'Assessment outcome for a competency element sign-off';

-- ---------------------------------------------------------------------------
-- LR0353: Placement Record Book — Daily Hour Logs
-- One row per working day; both student and supervisor must sign each entry
-- ---------------------------------------------------------------------------
CREATE TABLE placement_hours (
  id                        UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                 UUID                     NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  placement_id              UUID                     NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
  student_id                UUID                     NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  log_date                  DATE                     NOT NULL,
  time_in                   TIME,
  time_out                  TIME,
  hours_claimed             DECIMAL(4,2)             NOT NULL
                                                     CHECK (hours_claimed > 0 AND hours_claimed <= 24),
  activities_description    TEXT,
  learning_outcomes         TEXT,
  student_signature_data    TEXT,
  student_signed_at         TIMESTAMPTZ,
  verification_status       hour_verification_status DEFAULT 'pending',
  verified_by               UUID                     REFERENCES users(id),
  verified_at               TIMESTAMPTZ,
  supervisor_comments       TEXT,
  supervisor_signature_data TEXT,
  supervisor_signed_at      TIMESTAMPTZ,
  is_rejected               BOOLEAN                  DEFAULT false,
  rejection_reason          TEXT,
  week_number               INTEGER,
  created_at                TIMESTAMPTZ              DEFAULT NOW(),
  updated_at                TIMESTAMPTZ              DEFAULT NOW(),
  UNIQUE(placement_id, log_date),
  CONSTRAINT chk_time_order CHECK (
    time_in IS NULL OR time_out IS NULL OR time_in < time_out
  )
);

COMMENT ON TABLE placement_hours IS
  'LR0353 — Placement Record Book daily entries. Each row records one day of placement, '
  'signed by the student and counter-signed by the supervisor for verification.';
COMMENT ON COLUMN placement_hours.hours_claimed IS
  'Decimal hours claimed for the day (e.g. 7.5 for 7 hours 30 minutes)';
COMMENT ON COLUMN placement_hours.week_number IS
  'Computed placement week number (1-indexed) for progress reporting';
COMMENT ON COLUMN placement_hours.student_signature_data IS
  'Base64-encoded electronic signature or signed-document reference';

-- ---------------------------------------------------------------------------
-- Daily Placement Journal
-- Student's reflective learning journal entries reviewed by trainer
-- ---------------------------------------------------------------------------
CREATE TABLE placement_journal (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  placement_id        UUID         NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
  student_id          UUID         NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  entry_date          DATE         NOT NULL,
  content             TEXT         NOT NULL,
  goals_achieved      TEXT,
  challenges_faced    TEXT,
  learning_reflection TEXT,
  mood_rating         INTEGER      CHECK (mood_rating BETWEEN 1 AND 5),
  reviewed_by         UUID         REFERENCES users(id),
  reviewed_at         TIMESTAMPTZ,
  reviewer_feedback   TEXT,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(placement_id, entry_date)
);

COMMENT ON TABLE placement_journal IS
  'Student reflective journal — one entry per placement day, reviewed by trainer. '
  'Used as evidence of ongoing learning and assessment readiness.';
COMMENT ON COLUMN placement_journal.mood_rating IS
  '1=Very Stressed, 2=Stressed, 3=Neutral, 4=Good, 5=Excellent';

-- ---------------------------------------------------------------------------
-- Placement Evidence Uploads
-- Students upload artefacts (photos, reports, observations) as competency evidence
-- ---------------------------------------------------------------------------
CREATE TABLE placement_evidence (
  id                UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID                  NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  placement_id      UUID                  NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
  student_id        UUID                  NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  evidence_type     VARCHAR(100)          NOT NULL,
  title             VARCHAR(255)          NOT NULL,
  description       TEXT,
  competency_units  JSONB                 DEFAULT '[]',
  document_id       UUID,
  uploaded_at       TIMESTAMPTZ           DEFAULT NOW(),
  review_status     evidence_review_status DEFAULT 'pending',
  reviewed_by       UUID                  REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  review_notes      TEXT,
  created_at        TIMESTAMPTZ           DEFAULT NOW()
);

COMMENT ON TABLE placement_evidence IS
  'Evidence artefacts uploaded by students to support competency sign-offs. '
  'Linked to specific training unit codes for portfolio building.';
COMMENT ON COLUMN placement_evidence.evidence_type IS
  'E.g. "observation", "photo", "care_plan", "report", "third_party_report"';
COMMENT ON COLUMN placement_evidence.competency_units IS
  'Array of unit codes this evidence supports, e.g. ["CHCCCS031", "CHCCCS038"]';

-- ---------------------------------------------------------------------------
-- Competency Sign-offs
-- Supervisor attests to having observed a student demonstrate a competency element
-- ---------------------------------------------------------------------------
CREATE TABLE competency_signoffs (
  id                        UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                 UUID               NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  placement_id              UUID               NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
  student_id                UUID               NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  supervisor_id             UUID               REFERENCES supervisors(id),
  unit_code                 VARCHAR(50)        NOT NULL,
  unit_name                 VARCHAR(255)       NOT NULL,
  element_code              VARCHAR(50),
  element_description       TEXT,
  status                    competency_status  DEFAULT 'not_assessed',
  assessment_date           DATE,
  evidence_description      TEXT,
  supervisor_comments       TEXT,
  signed_at                 TIMESTAMPTZ,
  supervisor_signature_data TEXT,
  signed_ip                 INET,
  document_id               UUID,
  created_at                TIMESTAMPTZ        DEFAULT NOW(),
  updated_at                TIMESTAMPTZ        DEFAULT NOW()
);

COMMENT ON TABLE competency_signoffs IS
  'Supervisor-attested competency observations. Each row represents one element '
  'within a training unit, observed and signed off by the placement supervisor.';
COMMENT ON COLUMN competency_signoffs.unit_code IS
  'AVETMISS unit code, e.g. CHCCCS031 (Provide individualised support)';
COMMENT ON COLUMN competency_signoffs.element_code IS
  'Performance criteria element, e.g. "1.1" or "PC1.1" within the unit';
COMMENT ON COLUMN competency_signoffs.supervisor_signature_data IS
  'Base64-encoded PNG/SVG of supervisor''s electronic signature';

-- ---------------------------------------------------------------------------
-- Monitoring Visits (by Trainer)
-- Trainer contacts student and/or supervisor to check placement progress
-- ---------------------------------------------------------------------------
CREATE TABLE monitoring_visits (
  id                          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  placement_id                UUID         NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
  trainer_id                  UUID         NOT NULL REFERENCES users(id),
  visit_date                  DATE         NOT NULL,
  visit_type                  VARCHAR(50)  DEFAULT 'phone',
  contact_made_with           VARCHAR(255),
  student_progress_rating     INTEGER      CHECK (student_progress_rating BETWEEN 1 AND 5),
  hours_on_track              BOOLEAN      DEFAULT true,
  evidence_on_track           BOOLEAN      DEFAULT true,
  supervisor_engagement_rating INTEGER     CHECK (supervisor_engagement_rating BETWEEN 1 AND 5),
  issues_identified           TEXT,
  actions_required            TEXT,
  action_due_date             DATE,
  follow_up_required          BOOLEAN      DEFAULT false,
  follow_up_date              DATE,
  visit_notes                 TEXT,
  document_id                 UUID,
  created_at                  TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE monitoring_visits IS
  'Trainer monitoring contacts during the placement period. ASQA Standards require '
  'at minimum one monitoring visit per student per placement; more for at-risk placements.';
COMMENT ON COLUMN monitoring_visits.visit_type IS
  'Contact method: "phone" | "video_call" | "on_site" | "email" | "unannounced"';
COMMENT ON COLUMN monitoring_visits.contact_made_with IS
  'Name of the person contacted: student, supervisor, or both';
COMMENT ON COLUMN monitoring_visits.student_progress_rating IS
  '1=Far behind, 3=On track, 5=Ahead of schedule';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_placement_hours_placement ON placement_hours(placement_id);
CREATE INDEX idx_placement_hours_student   ON placement_hours(student_id);
CREATE INDEX idx_placement_hours_date      ON placement_hours(log_date);
CREATE INDEX idx_placement_hours_status    ON placement_hours(verification_status);
CREATE INDEX idx_placement_hours_tenant    ON placement_hours(tenant_id);

CREATE INDEX idx_journal_placement ON placement_journal(placement_id);
CREATE INDEX idx_journal_date      ON placement_journal(entry_date);
CREATE INDEX idx_journal_student   ON placement_journal(student_id);

CREATE INDEX idx_evidence_placement ON placement_evidence(placement_id);
CREATE INDEX idx_evidence_status    ON placement_evidence(review_status);
CREATE INDEX idx_evidence_student   ON placement_evidence(student_id);

CREATE INDEX idx_competency_placement ON competency_signoffs(placement_id);
CREATE INDEX idx_competency_unit      ON competency_signoffs(unit_code);
CREATE INDEX idx_competency_status    ON competency_signoffs(status);
CREATE INDEX idx_competency_supervisor ON competency_signoffs(supervisor_id);

CREATE INDEX idx_monitoring_placement ON monitoring_visits(placement_id);
CREATE INDEX idx_monitoring_trainer   ON monitoring_visits(trainer_id);
CREATE INDEX idx_monitoring_date      ON monitoring_visits(visit_date DESC);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER update_placement_hours_updated_at
  BEFORE UPDATE ON placement_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_updated_at
  BEFORE UPDATE ON placement_journal
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competency_updated_at
  BEFORE UPDATE ON competency_signoffs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
