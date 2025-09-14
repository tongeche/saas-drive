-- Manual fix for receipts table schema
-- Run these commands one by one in your Supabase SQL editor

-- Step 1: Check current receipts table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'receipts' 
ORDER BY ordinal_position;

-- Step 2: Add missing columns one by one
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS number text;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS vendor_name text;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS category text DEFAULT 'other';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tax_amount numeric(12,2) DEFAULT 0;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS total numeric(12,2);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS receipt_image_url text;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'Cash';

-- Step 3: Make invoice_id optional (since receipts can exist without invoices)
ALTER TABLE receipts ALTER COLUMN invoice_id DROP NOT NULL;

-- Step 4: Add foreign key constraint for client_id
ALTER TABLE receipts 
ADD CONSTRAINT fk_receipts_client 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Step 5: Add check constraints
ALTER TABLE receipts 
ADD CONSTRAINT receipts_category_check 
CHECK (category IN ('office_supplies', 'travel', 'meals', 'equipment', 'utilities', 'other'));

ALTER TABLE receipts 
ADD CONSTRAINT receipts_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE receipts 
ADD CONSTRAINT receipts_payment_method_check 
CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Mobile Money', 'Check', 'Other'));

-- Step 6: Add indexes
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(number);
CREATE INDEX IF NOT EXISTS idx_receipts_vendor_name ON receipts(vendor_name);
CREATE INDEX IF NOT EXISTS idx_receipts_client_id ON receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_method ON receipts(payment_method);

-- Step 7: Update existing data with defaults
UPDATE receipts SET total = amount WHERE total IS NULL AND amount IS NOT NULL;
UPDATE receipts SET category = 'other' WHERE category IS NULL;
UPDATE receipts SET status = 'pending' WHERE status IS NULL;
UPDATE receipts SET currency = 'EUR' WHERE currency IS NULL;
UPDATE receipts SET payment_method = 'Cash' WHERE payment_method IS NULL;

-- Step 8: Verify the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'receipts' 
ORDER BY ordinal_position;

-- Step 9: Check if any receipts exist
SELECT COUNT(*) as receipt_count FROM receipts;
