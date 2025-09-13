-- Simple cashflow table creation without conflicts
DO $$
BEGIN
  -- Create cashflow table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cashflow') THEN
    CREATE TABLE cashflow (
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
    CREATE INDEX idx_cashflow_tenant_id ON cashflow(tenant_id);
    CREATE INDEX idx_cashflow_transaction_type ON cashflow(transaction_type);
    CREATE INDEX idx_cashflow_transaction_date ON cashflow(transaction_date);
    CREATE INDEX idx_cashflow_category ON cashflow(category);
    CREATE INDEX idx_cashflow_reference_number ON cashflow(reference_number);

    -- Enable RLS
    ALTER TABLE cashflow ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Create policies if they don't exist
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'cashflow' AND policyname = 'Users can view cashflow from their tenant') THEN
    CREATE POLICY "Users can view cashflow from their tenant" ON cashflow
      FOR SELECT USING (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'cashflow' AND policyname = 'Users can insert cashflow for their tenant') THEN
    CREATE POLICY "Users can insert cashflow for their tenant" ON cashflow
      FOR INSERT WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'cashflow' AND policyname = 'Users can update cashflow from their tenant') THEN
    CREATE POLICY "Users can update cashflow from their tenant" ON cashflow
      FOR UPDATE USING (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'cashflow' AND policyname = 'Users can delete cashflow from their tenant') THEN
    CREATE POLICY "Users can delete cashflow from their tenant" ON cashflow
      FOR DELETE USING (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
      ));
  END IF;
END $$;
