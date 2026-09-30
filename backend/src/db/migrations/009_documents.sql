-- =============================================================================
-- Migration: 009_documents.sql
-- Description: Document management system — storage metadata, versioning,
--              and electronic signature records for all platform documents
-- Platform: EDUK8U Work Placement Intelligence Platform
-- Author: DB Schema Agent
-- Created: 2026-06-04
-- Depends on: 001_tenancy_auth.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE document_status AS ENUM (
  'active',
  'superseded',
  'archived',
  'deleted'
);

COMMENT ON TYPE document_status IS
  'Lifecycle state for a document; "deleted" is soft-delete only — records are never purged';

-- ---------------------------------------------------------------------------
-- Documents
-- Central document registry. All forms, agreements, evidence, and reports
-- are registered here with their storage metadata.
-- The actual binary is stored in object storage (S3/GCS); this table holds metadata.
-- ---------------------------------------------------------------------------
CREATE TABLE documents (
  id                        UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                 UUID              NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_type             VARCHAR(100)      NOT NULL,
  document_code             VARCHAR(50),
  form_code                 VARCHAR(20),
  entity_type               VARCHAR(100),
  entity_id                 UUID,
  original_filename         VARCHAR(500)      NOT NULL,
  stored_filename           VARCHAR(500),
  file_size_bytes           BIGINT,
  mime_type                 VARCHAR(200),
  storage_bucket            VARCHAR(255),
  storage_key               VARCHAR(1000),
  storage_url               TEXT,
  checksum_sha256           VARCHAR(64),
  version                   INTEGER           DEFAULT 1,
  status                    document_status   DEFAULT 'active',
  is_signed                 BOOLEAN           DEFAULT false,
  requires_signature        BOOLEAN           DEFAULT false,
  signature_count           INTEGER           DEFAULT 0,
  required_signature_count  INTEGER           DEFAULT 0,
  tags                      JSONB             DEFAULT '[]',
  metadata                  JSONB             DEFAULT '{}',
  uploaded_by               UUID              REFERENCES users(id),
  uploaded_at               TIMESTAMPTZ       DEFAULT NOW(),
  expires_at                TIMESTAMPTZ,
  created_at                TIMESTAMPTZ       DEFAULT NOW(),
  CONSTRAINT chk_signature_counts CHECK (
    signature_count >= 0 AND required_signature_count >= 0
    AND signature_count <= required_signature_count + 10
  ),
  CONSTRAINT chk_file_size CHECK (file_size_bytes IS NULL OR file_size_bytes > 0)
);

COMMENT ON TABLE documents IS
  'Central document registry for all platform files. Binary content lives in object storage; '
  'this table holds metadata, storage coordinates, and signature tracking.';
COMMENT ON COLUMN documents.document_type IS
  'High-level categorisation: "agreement", "evidence", "compliance_form", "report", "policy"';
COMMENT ON COLUMN documents.document_code IS
  'Internal document type code, e.g. "CA0355", "LR0353", "CA0393"';
COMMENT ON COLUMN documents.form_code IS
  'RTO form code matching the physical form reference (may differ from document_code)';
COMMENT ON COLUMN documents.entity_type IS
  'Logical entity this document belongs to: "placement", "student", "host_facility", etc.';
COMMENT ON COLUMN documents.storage_key IS
  'Object storage key (path) within the storage_bucket for retrieval';
COMMENT ON COLUMN documents.checksum_sha256 IS
  'SHA-256 hex digest of the file content for integrity verification';
COMMENT ON COLUMN documents.version IS
  'Version counter — incremented when a new version supersedes this document';
COMMENT ON COLUMN documents.expires_at IS
  'For time-limited documents (WWCC, insurance, police checks); triggers expiry alerts';
COMMENT ON COLUMN documents.metadata IS
  'Extensible JSON: page_count, extracted_text, ocr_confidence, AI classification results, etc.';

-- ---------------------------------------------------------------------------
-- Document Signatures
-- Individual signature events on documents — supports multiple signatories
-- per document (e.g. tripartite agreements require 3 signatures)
-- ---------------------------------------------------------------------------
CREATE TABLE document_signatures (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id      UUID         NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  signer_user_id   UUID         REFERENCES users(id),
  signer_name      VARCHAR(255) NOT NULL,
  signer_role      VARCHAR(100) NOT NULL,
  signer_email     VARCHAR(255),
  signature_type   VARCHAR(50)  DEFAULT 'electronic',
  signature_data   TEXT,
  signed_at        TIMESTAMPTZ  NOT NULL,
  ip_address       INET,
  user_agent       TEXT,
  is_valid         BOOLEAN      DEFAULT true,
  revoked_at       TIMESTAMPTZ,
  revoked_reason   TEXT,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT chk_revocation CHECK (
    is_valid = true OR revoked_at IS NOT NULL
  )
);

COMMENT ON TABLE document_signatures IS
  'Individual signature records for platform documents. Supports wet signatures, '
  'electronic signatures, and cryptographic signature verification metadata.';
COMMENT ON COLUMN document_signatures.signer_user_id IS
  'FK to platform users; NULL when signer is an external party (e.g. host supervisor)';
COMMENT ON COLUMN document_signatures.signature_type IS
  'Signature modality: "electronic" | "wet" | "digital" | "click_wrap"';
COMMENT ON COLUMN document_signatures.signature_data IS
  'Base64-encoded PNG/SVG of the signature, or a reference to a cryptographic cert';
COMMENT ON COLUMN document_signatures.is_valid IS
  'Set to false if the signature is revoked or invalidated (e.g. document superseded)';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_documents_tenant    ON documents(tenant_id);
CREATE INDEX idx_documents_entity    ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_type      ON documents(document_type);
CREATE INDEX idx_documents_status    ON documents(status);
CREATE INDEX idx_documents_form_code ON documents(tenant_id, form_code)
  WHERE form_code IS NOT NULL;
CREATE INDEX idx_documents_expiring  ON documents(expires_at)
  WHERE expires_at IS NOT NULL AND status = 'active';
CREATE INDEX idx_documents_unsigned  ON documents(tenant_id, requires_signature, is_signed)
  WHERE requires_signature = true AND is_signed = false;

CREATE INDEX idx_doc_signatures_document ON document_signatures(document_id);
CREATE INDEX idx_doc_signatures_user     ON document_signatures(signer_user_id)
  WHERE signer_user_id IS NOT NULL;
CREATE INDEX idx_doc_signatures_valid    ON document_signatures(document_id, is_valid)
  WHERE is_valid = true;
