-- SQL to show current tenant table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'tenants'
ORDER BY 
    ordinal_position;

-- Add missing columns for tenant branding/settings
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_email TEXT,
ADD COLUMN IF NOT EXISTS business_phone TEXT,
ADD COLUMN IF NOT EXISTS business_website TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#10B981',
ADD COLUMN IF NOT EXISTS invoice_footer TEXT,
ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'Payment due within 30 days',
ADD COLUMN IF NOT EXISTS bank_details TEXT;
