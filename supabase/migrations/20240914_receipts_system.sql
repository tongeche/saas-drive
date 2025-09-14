-- Create receipts table for expense receipt management
CREATE TABLE IF NOT EXISTS receipts (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Receipt identification
  number VARCHAR(50) NOT NULL,
  
  -- Vendor information
  vendor_name VARCHAR(255) NOT NULL,
  
  -- Receipt details
  category VARCHAR(50) NOT NULL DEFAULT 'other',
  description TEXT,
  date DATE NOT NULL,
  
  -- Financial information
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) GENERATED ALWAYS AS (amount + COALESCE(tax_amount, 0)) STORED,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Status and workflow
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Approval tracking
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(255),
  approval_notes TEXT,
  
  -- Rejection tracking
  rejected_at TIMESTAMPTZ,
  rejected_by VARCHAR(255),
  rejection_reason TEXT,
  
  -- Additional information
  notes TEXT,
  receipt_image_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_receipts_tenant_id ON receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(tenant_id, number);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(tenant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_vendor ON receipts(tenant_id, vendor_name);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(tenant_id, created_at DESC);

-- Unique constraint for receipt numbers per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_tenant_number_unique ON receipts(tenant_id, number);

-- Create audit log table for receipt status changes
CREATE TABLE IF NOT EXISTS receipt_status_logs (
  id BIGSERIAL PRIMARY KEY,
  receipt_id BIGINT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Status change tracking
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  comment TEXT,
  
  -- Change metadata
  changed_by VARCHAR(255),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_receipt_status_logs_receipt_id ON receipt_status_logs(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_status_logs_tenant_id ON receipt_status_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_receipt_status_logs_changed_at ON receipt_status_logs(changed_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_receipts_updated_at 
  BEFORE UPDATE ON receipts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for receipt images (if using Supabase storage)
-- This would typically be done through the Supabase dashboard or API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false) ON CONFLICT DO NOTHING;

-- RLS (Row Level Security) policies for receipts
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access receipts for their tenant
CREATE POLICY receipts_tenant_access ON receipts
  FOR ALL
  USING (
    tenant_id IN (
      SELECT t.id FROM tenants t
      WHERE t.id = receipts.tenant_id
      -- Add additional user-tenant relationship checks here
    )
  );

-- RLS for audit logs
ALTER TABLE receipt_status_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY receipt_status_logs_tenant_access ON receipt_status_logs
  FOR ALL
  USING (
    tenant_id IN (
      SELECT t.id FROM tenants t
      WHERE t.id = receipt_status_logs.tenant_id
    )
  );

-- Add some sample receipt categories as a helper view
CREATE OR REPLACE VIEW receipt_categories AS
SELECT 
  'office_supplies' as value, 'Office Supplies' as label, '📎' as icon
UNION ALL SELECT 'travel', 'Travel', '✈️'
UNION ALL SELECT 'meals', 'Meals & Entertainment', '🍽️'  
UNION ALL SELECT 'equipment', 'Equipment', '💻'
UNION ALL SELECT 'utilities', 'Utilities', '⚡'
UNION ALL SELECT 'software', 'Software & Subscriptions', '📱'
UNION ALL SELECT 'marketing', 'Marketing', '📈'
UNION ALL SELECT 'professional', 'Professional Services', '🏢'
UNION ALL SELECT 'other', 'Other', '📄';

-- Add comments for documentation
COMMENT ON TABLE receipts IS 'Store expense receipts with approval workflow';
COMMENT ON COLUMN receipts.number IS 'Unique receipt number per tenant (e.g., RCP-2024-001)';
COMMENT ON COLUMN receipts.category IS 'Receipt category for expense classification';
COMMENT ON COLUMN receipts.status IS 'Approval status: pending, approved, rejected';
COMMENT ON COLUMN receipts.total IS 'Computed total amount including tax';
COMMENT ON COLUMN receipts.receipt_image_url IS 'URL to uploaded receipt image';

COMMENT ON TABLE receipt_status_logs IS 'Audit trail for receipt status changes';
COMMENT ON VIEW receipt_categories IS 'Predefined receipt categories with labels and icons';
