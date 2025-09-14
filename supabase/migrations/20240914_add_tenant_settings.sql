-- Add new settings fields to tenants table for KES currency and East Africa timezone

-- First, let's check if we need to modify the existing payments table structure
-- Add method column to payments table if it doesn't exist (it should already exist)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS method text DEFAULT 'Cash' 
CHECK (method IN ('Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Mobile Money', 'Check', 'Other'));

-- Add default payment method setting to tenants table
-- This will serve as the default for new payments and receipts
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS default_payment_method text DEFAULT 'Cash' 
CHECK (default_payment_method IN ('Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Mobile Money', 'Check', 'Other'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenants_payment_method ON tenants(default_payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);

-- Add comments for documentation
COMMENT ON COLUMN tenants.default_payment_method IS 'Default payment method for all transactions and receipts for this tenant';
COMMENT ON COLUMN tenants.currency IS 'Default currency for invoices, receipts, and all financial transactions';
COMMENT ON COLUMN tenants.timezone IS 'Timezone setting affects date/time display across the application';
COMMENT ON COLUMN payments.method IS 'Payment method used for this payment transaction';

-- Update existing demo tenant to have KES currency and East Africa timezone (if exists)
UPDATE tenants 
SET 
  currency = 'KES',
  timezone = 'Africa/Nairobi',
  default_payment_method = 'Mobile Money'
WHERE slug = 'demo';

-- Fix the trigger function to handle null auth.uid() properly
CREATE OR REPLACE FUNCTION create_tenant_owner_relationship()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create relationship if auth.uid() is not null (user is authenticated)
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.user_tenants (user_id, tenant_id, role)
    VALUES (auth.uid(), NEW.id, 'owner')
    ON CONFLICT (user_id, tenant_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists with the updated function
DROP TRIGGER IF EXISTS on_tenant_created ON tenants;
CREATE TRIGGER on_tenant_created
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_tenant_owner_relationship();

-- Note: Demo tenant creation skipped to avoid auth.uid() issues during migration.
-- To create a demo tenant manually later, use:
-- INSERT INTO tenants (slug, business_name, currency, timezone, default_payment_method, owner_email)
-- VALUES ('demo-kes', 'East Africa Demo Business', 'KES', 'Africa/Nairobi', 'Mobile Money', 'demo-kenya@example.com');
