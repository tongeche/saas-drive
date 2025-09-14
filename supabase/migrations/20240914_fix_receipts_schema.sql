-- Add missing columns to receipts table for full receipt functionality
-- Migration: Fix receipts table schema

-- Add missing columns to receipts table
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS number text,
ADD COLUMN IF NOT EXISTS vendor_name text,
ADD COLUMN IF NOT EXISTS category text DEFAULT 'other',
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS tax_amount numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total numeric(12,2),
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS receipt_image_url text,
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Mobile Money', 'Check', 'Other'));

-- Make invoice_id optional since receipts can exist without invoices
ALTER TABLE receipts 
ALTER COLUMN invoice_id DROP NOT NULL;

-- Add constraints for category
ALTER TABLE receipts 
DROP CONSTRAINT IF EXISTS receipts_category_check;
ALTER TABLE receipts 
ADD CONSTRAINT receipts_category_check 
CHECK (category IN ('office_supplies', 'travel', 'meals', 'equipment', 'utilities', 'other'));

-- Add unique constraint for receipt numbers per tenant
ALTER TABLE receipts 
DROP CONSTRAINT IF EXISTS receipts_tenant_number_unique;
ALTER TABLE receipts 
ADD CONSTRAINT receipts_tenant_number_unique 
UNIQUE (tenant_id, number);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(number);
CREATE INDEX IF NOT EXISTS idx_receipts_vendor_name ON receipts(vendor_name);
CREATE INDEX IF NOT EXISTS idx_receipts_client_id ON receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_method ON receipts(payment_method);

-- Add comments for documentation
COMMENT ON COLUMN receipts.number IS 'Unique receipt identifier (e.g., RCP-2024-001)';
COMMENT ON COLUMN receipts.vendor_name IS 'Name of the vendor/supplier';
COMMENT ON COLUMN receipts.category IS 'Category of expense (office supplies, travel, meals, etc.)';
COMMENT ON COLUMN receipts.description IS 'Description of the receipt/purchase';
COMMENT ON COLUMN receipts.tax_amount IS 'Tax amount for this receipt';
COMMENT ON COLUMN receipts.total IS 'Total amount including tax';
COMMENT ON COLUMN receipts.currency IS 'Currency for amounts (EUR, KES, etc.)';
COMMENT ON COLUMN receipts.status IS 'Approval status of the receipt';
COMMENT ON COLUMN receipts.receipt_image_url IS 'URL to uploaded receipt image';
COMMENT ON COLUMN receipts.client_id IS 'Optional reference to client when receipt is from an existing client';
COMMENT ON COLUMN receipts.payment_method IS 'Payment method used for this receipt transaction';

-- Update existing receipts with default values if any exist
UPDATE receipts 
SET 
  total = amount 
WHERE total IS NULL AND amount IS NOT NULL;

UPDATE receipts 
SET 
  category = 'other' 
WHERE category IS NULL;

UPDATE receipts 
SET 
  status = 'pending' 
WHERE status IS NULL;

UPDATE receipts 
SET 
  currency = 'EUR' 
WHERE currency IS NULL;

UPDATE receipts 
SET 
  payment_method = 'Cash' 
WHERE payment_method IS NULL;

-- Generate receipt numbers for existing receipts if they don't have them
DO $$
DECLARE
    receipt_record RECORD;
    counter INTEGER := 1;
BEGIN
    FOR receipt_record IN 
        SELECT id, tenant_id, created_at 
        FROM receipts 
        WHERE number IS NULL 
        ORDER BY created_at
    LOOP
        UPDATE receipts 
        SET number = 'RCP-' || TO_CHAR(EXTRACT(YEAR FROM receipt_record.created_at), 'FM0000') || '-' || LPAD(counter::text, 3, '0')
        WHERE id = receipt_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;
