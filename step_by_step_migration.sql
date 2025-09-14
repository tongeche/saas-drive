-- Step-by-step migration to avoid dependency issues
-- Run these commands one by one in your Supabase SQL editor

-- Step 1: Add the default_payment_method column to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS default_payment_method text DEFAULT 'Cash' 
CHECK (default_payment_method IN ('Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Mobile Money', 'Check', 'Other'));

-- Step 2: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_tenants_payment_method ON tenants(default_payment_method);

-- Step 3: Add client_id and payment_method to receipts table
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'Cash' 
CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Mobile Money', 'Check', 'Other'));

-- Step 4: Add indexes for receipts
CREATE INDEX IF NOT EXISTS idx_receipts_client_id ON receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_method ON receipts(payment_method);

-- Step 5: Update existing demo tenant (if it exists)
UPDATE tenants 
SET 
  currency = 'KES',
  timezone = 'Africa/Nairobi',
  default_payment_method = 'Mobile Money'
WHERE slug = 'demo';

-- Step 6: Add documentation comments
COMMENT ON COLUMN tenants.default_payment_method IS 'Default payment method for all transactions and receipts for this tenant';
COMMENT ON COLUMN receipts.client_id IS 'Optional reference to client when receipt is from an existing client';
COMMENT ON COLUMN receipts.payment_method IS 'Payment method used for this receipt transaction';

-- Step 7: Insert demo tenant if it doesn't exist (choose one option below)

-- Option A: If you have auth users in your system
INSERT INTO tenants (slug, business_name, currency, timezone, default_payment_method, owner_email, created_by)
SELECT 'demo', 'Nairobi Tech Solutions', 'KES', 'Africa/Nairobi', 'Mobile Money', 'demo@naitech.co.ke', 
       (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE slug = 'demo');

-- Option B: If you don't have auth users yet
-- INSERT INTO tenants (slug, business_name, currency, timezone, default_payment_method, owner_email, created_by)
-- VALUES ('demo', 'Nairobi Tech Solutions', 'KES', 'Africa/Nairobi', 'Mobile Money', 'demo@naitech.co.ke', gen_random_uuid())
-- ON CONFLICT (slug) DO NOTHING;

-- Option C: If created_by column is nullable or doesn't exist
-- INSERT INTO tenants (slug, business_name, currency, timezone, default_payment_method, owner_email)
-- VALUES ('demo', 'Nairobi Tech Solutions', 'KES', 'Africa/Nairobi', 'Mobile Money', 'demo@naitech.co.ke')
-- ON CONFLICT (slug) DO NOTHING;

-- Verify the changes
SELECT slug, business_name, currency, timezone, default_payment_method 
FROM tenants 
WHERE slug = 'demo';
