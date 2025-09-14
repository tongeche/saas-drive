-- Simple tenant settings update - just currency and timezone
-- Run this instead if the main migration has issues

-- Step 1: Update existing demo tenant to have KES currency and East Africa timezone
UPDATE tenants 
SET 
  currency = 'KES',
  timezone = 'Africa/Nairobi'
WHERE slug = 'demo';

-- Step 2: Verify the payments table has a method column (it should from the init schema)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payments' AND column_name = 'method';

-- Step 3: Verify the receipts table has a payment_method column (should be added by other migration)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'receipts' AND column_name IN ('method', 'payment_method');

-- Step 4: Check current tenants
SELECT slug, business_name, currency, timezone FROM tenants;

-- Step 5: If you want to create a new demo tenant for KES testing:
-- INSERT INTO tenants (slug, business_name, currency, timezone, owner_email)
-- VALUES ('demo-kes', 'East Africa Demo Business', 'KES', 'Africa/Nairobi', 'demo-kenya@example.com')
-- ON CONFLICT (slug) DO UPDATE SET
--   currency = EXCLUDED.currency,
--   timezone = EXCLUDED.timezone;
