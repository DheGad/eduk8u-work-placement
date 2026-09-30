-- =============================================================================
-- Migration: 016_rbac_permissions.sql
-- Description: Dynamic RBAC mapping for tenants
-- =============================================================================

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  module VARCHAR(50) NOT NULL
);

CREATE TABLE tenant_role_permissions (
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role_name VARCHAR(50) NOT NULL, -- The base user_role enum
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, role_name, permission_id)
);

-- Seed basic permissions
INSERT INTO permissions (id, name, description, module) VALUES 
  (uuid_generate_v4(), 'manage_placements', 'Create, update, delete placements', 'placements'),
  (uuid_generate_v4(), 'approve_hours', 'Approve logged placement hours', 'hours'),
  (uuid_generate_v4(), 'view_audit_logs', 'View activity and audit trails', 'system'),
  (uuid_generate_v4(), 'manage_users', 'Add, suspend, or update users', 'users'),
  (uuid_generate_v4(), 'manage_tenant_settings', 'Update branding and organization configs', 'system')
ON CONFLICT (name) DO NOTHING;
