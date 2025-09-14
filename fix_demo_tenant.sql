-- Quick fix for adding demo tenant when created_by column exists
-- Run this if the main migration fails due to created_by constraint

-- Option 1: Insert demo tenant with first available user as created_by
INSERT INTO tenants (
  slug, business_name, currency, timezone, default_payment_method, owner_email, created_by
)
SELECT 
  'demo', 
  'Nairobi Tech Solutions', 
  'KES', 
  'Africa/Nairobi', 
  'Mobile Money', 
  'demo@naitech.co.ke',
  (SELECT id FROM auth.users LIMIT 1)
ON CONFLICT (slug) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  currency = EXCLUDED.currency,
  timezone = EXCLUDED.timezone,
  default_payment_method = EXCLUDED.default_payment_method;

-- Option 2: If you don't have any auth users yet, create a placeholder
-- (Only run this if Option 1 fails due to no users)
/*
INSERT INTO tenants (
  slug, business_name, currency, timezone, default_payment_method, owner_email, created_by
)
VALUES (
  'demo', 
  'Nairobi Tech Solutions', 
  'KES', 
  'Africa/Nairobi', 
  'Mobile Money', 
  'demo@naitech.co.ke',
  gen_random_uuid()  -- Temporary placeholder UUID
)
ON CONFLICT (slug) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  currency = EXCLUDED.currency,
  timezone = EXCLUDED.timezone,
  default_payment_method = EXCLUDED.default_payment_method;
*/

-- Check the result
SELECT slug, business_name, currency, timezone, default_payment_method 
FROM tenants 
WHERE slug = 'demo';
