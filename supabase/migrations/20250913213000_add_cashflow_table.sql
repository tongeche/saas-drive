-- Create cashflow table for cash in/out transactions
CREATE TABLE IF NOT EXISTS cashflow (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('cash_in', 'cash_out')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'EUR',
  description TEXT NOT NULL,
  category VARCHAR(100),
  reference_number VARCHAR(100),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cashflow_tenant_id ON cashflow(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_transaction_type ON cashflow(transaction_type);
CREATE INDEX IF NOT EXISTS idx_cashflow_transaction_date ON cashflow(transaction_date);
CREATE INDEX IF NOT EXISTS idx_cashflow_category ON cashflow(category);
CREATE INDEX IF NOT EXISTS idx_cashflow_reference_number ON cashflow(reference_number);

-- Enable RLS
ALTER TABLE cashflow ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view cashflow from their tenant" ON cashflow
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert cashflow for their tenant" ON cashflow
  FOR INSERT WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update cashflow from their tenant" ON cashflow
  FOR UPDATE USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete cashflow from their tenant" ON cashflow
  FOR DELETE USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

-- Update function for updated_at
CREATE OR REPLACE FUNCTION update_cashflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cashflow_updated_at
  BEFORE UPDATE ON cashflow
  FOR EACH ROW
  EXECUTE FUNCTION update_cashflow_updated_at();

-- Create view for cashflow summary by month
CREATE VIEW cashflow_monthly_summary AS
SELECT 
  tenant_id,
  DATE_TRUNC('month', transaction_date) as month,
  currency,
  SUM(CASE WHEN transaction_type = 'cash_in' THEN amount ELSE 0 END) as total_cash_in,
  SUM(CASE WHEN transaction_type = 'cash_out' THEN amount ELSE 0 END) as total_cash_out,
  SUM(CASE WHEN transaction_type = 'cash_in' THEN amount ELSE -amount END) as net_cashflow,
  COUNT(*) as transaction_count
FROM cashflow
GROUP BY tenant_id, DATE_TRUNC('month', transaction_date), currency
ORDER BY month DESC;
