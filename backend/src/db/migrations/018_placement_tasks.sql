CREATE TABLE placement_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  placement_id UUID NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'reviewed')),
  due_date DATE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_placement_tasks_placement_id ON placement_tasks(placement_id);
CREATE INDEX idx_placement_tasks_tenant_id ON placement_tasks(tenant_id);

CREATE TRIGGER update_placement_tasks_updated_at
  BEFORE UPDATE ON placement_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
