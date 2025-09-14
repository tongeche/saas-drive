-- Complete receipts table schema fix
-- This ensures all required columns exist for the receipt system

-- First, create the receipts table if it doesn't exist
CREATE TABLE IF NOT EXISTS receipts (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
    number VARCHAR(50),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor_name VARCHAR(255),
    description TEXT,
    category VARCHAR(50) DEFAULT 'other',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) GENERATED ALWAYS AS (amount + COALESCE(tax_amount, 0)) STORED,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_method VARCHAR(50) DEFAULT 'Cash',
    status VARCHAR(20) DEFAULT 'pending',
    receipt_image_url TEXT,
    notes TEXT
);

-- Add missing columns if they don't exist (safe to run multiple times)
DO $$ 
BEGIN
    -- Add client_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'client_id') THEN
        ALTER TABLE receipts ADD COLUMN client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
    END IF;

    -- Add category column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'category') THEN
        ALTER TABLE receipts ADD COLUMN category VARCHAR(50) DEFAULT 'other';
    END IF;

    -- Add vendor_name column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'vendor_name') THEN
        ALTER TABLE receipts ADD COLUMN vendor_name VARCHAR(255);
    END IF;

    -- Add payment_method column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'payment_method') THEN
        ALTER TABLE receipts ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Cash';
    END IF;

    -- Add tax_amount column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'tax_amount') THEN
        ALTER TABLE receipts ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add total column if missing (as computed column)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'total') THEN
        ALTER TABLE receipts ADD COLUMN total DECIMAL(10,2) GENERATED ALWAYS AS (amount + COALESCE(tax_amount, 0)) STORED;
    END IF;

    -- Add currency column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'currency') THEN
        ALTER TABLE receipts ADD COLUMN currency VARCHAR(3) DEFAULT 'EUR';
    END IF;

    -- Add receipt_image_url column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'receipt_image_url') THEN
        ALTER TABLE receipts ADD COLUMN receipt_image_url TEXT;
    END IF;

    -- Add notes column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'notes') THEN
        ALTER TABLE receipts ADD COLUMN notes TEXT;
    END IF;

    -- Add date column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'date') THEN
        ALTER TABLE receipts ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;

    -- Add status column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'status') THEN
        ALTER TABLE receipts ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
    END IF;

    -- Add number column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'number') THEN
        ALTER TABLE receipts ADD COLUMN number VARCHAR(50);
    END IF;

    -- Add updated_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'updated_at') THEN
        ALTER TABLE receipts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_receipts_tenant_id ON receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_receipts_client_id ON receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);

-- Enable Row Level Security
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Tenants can view their own receipts" ON receipts;
CREATE POLICY "Tenants can view their own receipts" ON receipts
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM tenants WHERE slug = current_setting('app.current_tenant', true)
    ));

DROP POLICY IF EXISTS "Tenants can insert their own receipts" ON receipts;
CREATE POLICY "Tenants can insert their own receipts" ON receipts
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT id FROM tenants WHERE slug = current_setting('app.current_tenant', true)
    ));

DROP POLICY IF EXISTS "Tenants can update their own receipts" ON receipts;
CREATE POLICY "Tenants can update their own receipts" ON receipts
    FOR UPDATE USING (tenant_id IN (
        SELECT id FROM tenants WHERE slug = current_setting('app.current_tenant', true)
    ));

DROP POLICY IF EXISTS "Tenants can delete their own receipts" ON receipts;
CREATE POLICY "Tenants can delete their own receipts" ON receipts
    FOR DELETE USING (tenant_id IN (
        SELECT id FROM tenants WHERE slug = current_setting('app.current_tenant', true)
    ));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_receipts_updated_at ON receipts;
CREATE TRIGGER update_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
