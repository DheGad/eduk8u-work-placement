-- =============================================================================
-- Migration: 014_email_logs.sql
-- Description: Tracking outbound emails for audit and reliability
-- =============================================================================

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  provider VARCHAR(50) DEFAULT 'mock',
  status VARCHAR(50) DEFAULT 'sent',
  error_message TEXT,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_logs_tenant ON email_logs(tenant_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
