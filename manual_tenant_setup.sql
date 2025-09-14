-- Manual tenant setup script - run this if the migration still has issues
-- Run these commands one by one in your Supabase SQL editor

-- Step 1: Add the payment method column (safe to run multiple times)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS default_payment_method text DEFAULT 'Cash' 
CHECK (default_payment_method IN ('Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Mobile Money', 'Check', 'Other'));

-- Step 2: Update existing demo tenant if it exists
UPDATE tenants 
SET 
  currency = 'KES',
  timezone = 'Africa/Nairobi',
  default_payment_method = 'Mobile Money'
WHERE slug = 'demo';

-- Step 3: Check if we have any auth users
SELECT 'Current auth users:' as info, count(*) as user_count FROM auth.users;
SELECT id, email FROM auth.users LIMIT 3;

-- Step 4: Check current tenants
SELECT 'Current tenants:' as info;
SELECT slug, business_name, currency, timezone, default_payment_method FROM tenants;

-- Step 5: If you want to create a demo tenant manually (adjust the user_id)
-- First, get a user ID from the auth.users table above, then run:

-- INSERT INTO tenants (slug, business_name, currency, timezone, default_payment_method, owner_email, created_by)
-- VALUES ('demo-kes', 'East Africa Demo Business', 'KES', 'Africa/Nairobi', 'Mobile Money', 'demo-kenya@example.com', 'YOUR_USER_ID_HERE');

-- Step 6: Create the user-tenant relationship manually if needed
-- INSERT INTO user_tenants (user_id, tenant_id, role)
-- SELECT 'YOUR_USER_ID_HERE', id, 'owner' 
-- FROM tenants 
-- WHERE slug = 'demo-kes';

-- Step 7: Verify everything is set up correctly
SELECT 
  t.slug,
  t.business_name,
  t.currency,
  t.timezone,
  t.default_payment_method,
  ut.role,
  u.email as owner_email
FROM tenants t
LEFT JOIN user_tenants ut ON t.id = ut.tenant_id
LEFT JOIN auth.users u ON ut.user_id = u.id
WHERE t.slug IN ('demo', 'demo-kes');
