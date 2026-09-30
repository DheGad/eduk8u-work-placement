-- =============================================================================
-- Migration: 004_host_facilities.sql
-- Description: Host facility management — approval, suitability checklists,
--              insurance tracking, and workplace agreements (CA0393, CA0316)
-- Platform: EDUK8U Work Placement Intelligence Platform
-- Author: DB Schema Agent
-- Created: 2026-06-04
-- Depends on: 001_tenancy_auth.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE facility_approval_status AS ENUM (
  'pending',
  'under_review',
  'approved',
  'conditionally_approved',
  'rejected',
  'suspended'
);

CREATE TYPE agreement_status AS ENUM (
  'draft',
  'sent',
  'partially_signed',
  'fully_signed',
  'expired',
  'cancelled'
);

COMMENT ON TYPE facility_approval_status IS
  'Lifecycle states for a host facility''s approval with the RTO';
COMMENT ON TYPE agreement_status IS
  'Signature lifecycle states for workplace agreements and similar documents';

-- ---------------------------------------------------------------------------
-- Host Facilities
-- Organisations or sites that host students for work placements
-- ---------------------------------------------------------------------------
CREATE TABLE host_facilities (
  id                      UUID                      PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID                      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  facility_name           VARCHAR(255)              NOT NULL,
  trading_name            VARCHAR(255),
  abn                     VARCHAR(11),
  facility_type           VARCHAR(100),
  address_line1           VARCHAR(255),
  address_line2           VARCHAR(255),
  suburb                  VARCHAR(100),
  state                   VARCHAR(3),
  postcode                VARCHAR(4),
  country                 VARCHAR(50)               DEFAULT 'Australia',
  phone                   VARCHAR(20),
  email                   VARCHAR(255),
  website                 VARCHAR(255),
  primary_contact_name    VARCHAR(255),
  primary_contact_role    VARCHAR(100),
  primary_contact_phone   VARCHAR(20),
  primary_contact_email   VARCHAR(255),
  student_capacity        INTEGER                   DEFAULT 1,
  current_student_count   INTEGER                   DEFAULT 0,
  approval_status         facility_approval_status  DEFAULT 'pending',
  approved_at             TIMESTAMPTZ,
  approved_by             UUID                      REFERENCES users(id),
  approval_notes          TEXT,
  is_active               BOOLEAN                   DEFAULT true,
  notes                   TEXT,
  metadata                JSONB                     DEFAULT '{}',
  created_by              UUID                      REFERENCES users(id),
  created_at              TIMESTAMPTZ               DEFAULT NOW(),
  updated_at              TIMESTAMPTZ               DEFAULT NOW(),
  CONSTRAINT chk_student_capacity CHECK (student_capacity >= 0),
  CONSTRAINT chk_current_student_count CHECK (current_student_count >= 0)
);

COMMENT ON TABLE host_facilities IS
  'Approved host organisations and sites where students undertake work placements';
COMMENT ON COLUMN host_facilities.abn IS
  'Australian Business Number of the host entity (11 digits)';
COMMENT ON COLUMN host_facilities.student_capacity IS
  'Maximum concurrent students this facility can accommodate';
COMMENT ON COLUMN host_facilities.current_student_count IS
  'Denormalised count — updated by trigger or application when placements change';
COMMENT ON COLUMN host_facilities.metadata IS
  'Extensible JSON for facility-type-specific attributes, NDIS provider numbers, etc.';

-- ---------------------------------------------------------------------------
-- CA 0393: Host Facility Suitability Checklist
-- Records the structured assessment performed before a facility is approved
-- ---------------------------------------------------------------------------
CREATE TABLE host_suitability_checklists (
  id                          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  host_facility_id            UUID         NOT NULL REFERENCES host_facilities(id) ON DELETE CASCADE,
  form_code                   VARCHAR(20)  DEFAULT 'CA0393',
  assessed_by                 UUID         REFERENCES users(id),
  assessment_date             DATE,
  -- Scored dimensions (1–5 Likert scale)
  physical_environment_score  INTEGER      CHECK (physical_environment_score BETWEEN 1 AND 5),
  supervision_capacity_score  INTEGER      CHECK (supervision_capacity_score BETWEEN 1 AND 5),
  equipment_resources_score   INTEGER      CHECK (equipment_resources_score BETWEEN 1 AND 5),
  policies_procedures_score   INTEGER      CHECK (policies_procedures_score BETWEEN 1 AND 5),
  whs_compliance_score        INTEGER      CHECK (whs_compliance_score BETWEEN 1 AND 5),
  -- Full checklist answers stored as structured JSON
  checked_items               JSONB        DEFAULT '{}',
  overall_rating              VARCHAR(50),
  is_approved                 BOOLEAN      DEFAULT false,
  approved_at                 TIMESTAMPTZ,
  approved_by                 UUID         REFERENCES users(id),
  notes                       TEXT,
  next_review_date            DATE,
  document_id                 UUID,
  created_at                  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE host_suitability_checklists IS
  'CA0393 — Structured suitability assessment for host facilities. '
  'Scored dimensions align with ASQA Standards for RTOs 2015 Clause 1.4.';
COMMENT ON COLUMN host_suitability_checklists.checked_items IS
  'JSON map of {item_id: {label, checked, notes}} for all checklist line items';
COMMENT ON COLUMN host_suitability_checklists.document_id IS
  'FK to documents.id for the signed/uploaded version of the completed CA0393';

-- ---------------------------------------------------------------------------
-- Insurance Records
-- Tracks current and historical insurance policies for each host facility
-- ---------------------------------------------------------------------------
CREATE TABLE host_insurance_records (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  host_facility_id  UUID         NOT NULL REFERENCES host_facilities(id) ON DELETE CASCADE,
  insurance_type    VARCHAR(100) NOT NULL,
  insurer_name      VARCHAR(255),
  policy_number     VARCHAR(100),
  coverage_amount   DECIMAL(15,2),
  coverage_currency VARCHAR(3)   DEFAULT 'AUD',
  start_date        DATE,
  expiry_date       DATE         NOT NULL,
  is_current        BOOLEAN      DEFAULT true,
  document_id       UUID,
  verified_at       TIMESTAMPTZ,
  verified_by       UUID         REFERENCES users(id),
  notes             TEXT,
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT chk_insurance_dates CHECK (start_date IS NULL OR start_date < expiry_date)
);

COMMENT ON TABLE host_insurance_records IS
  'Insurance policy records for host facilities. RTOs are required to sight '
  'current public liability insurance before approving a placement.';
COMMENT ON COLUMN host_insurance_records.insurance_type IS
  'E.g. "Public Liability", "Workers Compensation", "Professional Indemnity"';
COMMENT ON COLUMN host_insurance_records.is_current IS
  'Set to false when a new policy is uploaded — maintains full policy history';

-- ---------------------------------------------------------------------------
-- CA 0316: Workplace Agreement
-- Formal agreement between the RTO and the host organisation governing
-- the placement relationship, signed by both parties
-- ---------------------------------------------------------------------------
CREATE TABLE workplace_agreements (
  id                          UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                   UUID              NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  host_facility_id            UUID              NOT NULL REFERENCES host_facilities(id) ON DELETE CASCADE,
  form_code                   VARCHAR(20)       DEFAULT 'CA0316',
  agreement_number            VARCHAR(50)       UNIQUE,
  agreement_date              DATE,
  valid_from                  DATE,
  valid_until                 DATE,
  terms                       JSONB             DEFAULT '{}',
  responsibilities_host       TEXT,
  responsibilities_college    TEXT,
  special_conditions          TEXT,
  status                      agreement_status  DEFAULT 'draft',
  -- Host signatory
  signed_by_host_name         VARCHAR(255),
  signed_by_host_role         VARCHAR(100),
  signed_by_host_at           TIMESTAMPTZ,
  signed_by_host_ip           INET,
  -- College/RTO signatory
  signed_by_college_name      VARCHAR(255),
  signed_by_college_role      VARCHAR(100),
  signed_by_college_at        TIMESTAMPTZ,
  signed_by_college_ip        INET,
  document_id                 UUID,
  created_by                  UUID              REFERENCES users(id),
  created_at                  TIMESTAMPTZ       DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ       DEFAULT NOW(),
  CONSTRAINT chk_agreement_dates CHECK (
    valid_from IS NULL OR valid_until IS NULL OR valid_from <= valid_until
  )
);

COMMENT ON TABLE workplace_agreements IS
  'CA0316 — Bilateral agreement between RTO and host facility. '
  'Must be fully_signed before any student placement can commence at this facility.';
COMMENT ON COLUMN workplace_agreements.agreement_number IS
  'Human-readable reference number for the agreement, e.g. WA-2024-00123';
COMMENT ON COLUMN workplace_agreements.terms IS
  'Structured JSON of negotiated terms and standard clauses';
COMMENT ON COLUMN workplace_agreements.document_id IS
  'FK to documents.id for the finalised signed PDF/e-signature record';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_host_facilities_tenant      ON host_facilities(tenant_id);
CREATE INDEX idx_host_facilities_status      ON host_facilities(approval_status);
CREATE INDEX idx_host_facilities_active      ON host_facilities(tenant_id, is_active);
CREATE INDEX idx_host_suitability_host       ON host_suitability_checklists(host_facility_id);
CREATE INDEX idx_host_suitability_tenant     ON host_suitability_checklists(tenant_id);
CREATE INDEX idx_host_insurance_host         ON host_insurance_records(host_facility_id);
CREATE INDEX idx_host_insurance_expiry       ON host_insurance_records(expiry_date);
CREATE INDEX idx_host_insurance_current      ON host_insurance_records(host_facility_id, is_current) WHERE is_current = true;
CREATE INDEX idx_workplace_agreements_host   ON workplace_agreements(host_facility_id);
CREATE INDEX idx_workplace_agreements_status ON workplace_agreements(status);
CREATE INDEX idx_workplace_agreements_tenant ON workplace_agreements(tenant_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER update_host_facilities_updated_at
  BEFORE UPDATE ON host_facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_host_suitability_updated_at
  BEFORE UPDATE ON host_suitability_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workplace_agreements_updated_at
  BEFORE UPDATE ON workplace_agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
