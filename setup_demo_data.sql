-- Insert demo tenant and sample clients for testing (East Africa setup)

-- Insert demo tenant with KES currency and East Africa settings
-- Handle created_by column if it exists
DO $$
BEGIN
  -- Check if created_by column exists and insert accordingly
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'created_by') THEN
    -- Insert with created_by column (use first available auth user or a dummy UUID)
    INSERT INTO tenants (slug, business_name, currency, timezone, default_payment_method, owner_email, created_by)
    SELECT 'demo', 'Nairobi Tech Solutions', 'KES', 'Africa/Nairobi', 'Mobile Money', 'demo@naitech.co.ke', 
           COALESCE((SELECT id FROM auth.users LIMIT 1), gen_random_uuid())
    ON CONFLICT (slug) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      currency = EXCLUDED.currency,
      timezone = EXCLUDED.timezone,
      default_payment_method = EXCLUDED.default_payment_method;
  ELSE
    -- Insert without created_by column
    INSERT INTO tenants (slug, business_name, currency, timezone, default_payment_method, owner_email)
    VALUES ('demo', 'Nairobi Tech Solutions', 'KES', 'Africa/Nairobi', 'Mobile Money', 'demo@naitech.co.ke')
    ON CONFLICT (slug) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      currency = EXCLUDED.currency,
      timezone = EXCLUDED.timezone,
      default_payment_method = EXCLUDED.default_payment_method;
  END IF;
END $$;

-- Insert sample clients for the demo tenant (East African businesses)
WITH demo_tenant AS (
  SELECT id FROM tenants WHERE slug = 'demo'
)
INSERT INTO clients (tenant_id, name, email, phone, billing_address)
SELECT 
  demo_tenant.id,
  client_data.name,
  client_data.email,
  client_data.phone,
  client_data.billing_address
FROM demo_tenant,
(VALUES
  ('Safaricom Business', 'business@safaricom.co.ke', '+254-722-000-001', 'Safaricom House, Waiyaki Way, Nairobi'),
  ('Kenya Power', 'billing@kplc.co.ke', '+254-711-000-002', 'Stima Plaza, Kolobot Road, Nairobi'),
  ('Java Coffee House', 'corporate@javacoffee.co.ke', '+254-733-000-003', 'Mama Ngina Street, Nairobi CBD'),
  ('Equity Bank', 'business@equitybank.co.ke', '+254-766-000-004', 'Equity Centre, Upper Hill, Nairobi'),
  ('Bolt Kenya', 'business@bolt.co.ke', '+254-700-000-005', 'Rideshare services Kenya'),
  ('Jumia Kenya', 'business@jumia.co.ke', '+254-788-000-006', 'Online marketplace services'),
  ('KFC Kenya', 'corporate@kfc.co.ke', '+254-755-000-007', 'Yum Brands, Westlands, Nairobi'),
  ('DHL Kenya', 'business@dhl.co.ke', '+254-744-000-008', 'Shipping and logistics services')
) AS client_data(name, email, phone, billing_address)
ON CONFLICT DO NOTHING;

-- Insert sample receipts for demonstration
WITH demo_tenant AS (
  SELECT id FROM tenants WHERE slug = 'demo'
),
safaricom_client AS (
  SELECT c.id FROM clients c 
  JOIN demo_tenant dt ON c.tenant_id = dt.id 
  WHERE c.name = 'Safaricom Business'
),
java_client AS (
  SELECT c.id FROM clients c 
  JOIN demo_tenant dt ON c.tenant_id = dt.id 
  WHERE c.name = 'Java Coffee House'
)
INSERT INTO receipts (
  tenant_id, client_id, number, vendor_name, category, description, 
  date, amount, tax_amount, currency, payment_method, status
)
SELECT 
  demo_tenant.id,
  receipt_data.client_id,
  receipt_data.number,
  receipt_data.vendor_name,
  receipt_data.category,
  receipt_data.description,
  receipt_data.date,
  receipt_data.amount,
  receipt_data.tax_amount,
  'KES',
  receipt_data.payment_method,
  receipt_data.status
FROM demo_tenant,
(VALUES
  ((SELECT id FROM safaricom_client), 'RCP-2024-001', 'Safaricom Business', 'utilities', 'Monthly mobile services', '2024-09-01', 12500, 2000, 'Mobile Money', 'approved'),
  (NULL, 'RCP-2024-002', 'Kenya Power', 'utilities', 'Monthly electricity bill', '2024-09-05', 8500, 1360, 'Bank Transfer', 'approved'),
  ((SELECT id FROM java_client), 'RCP-2024-003', 'Java Coffee House', 'meals', 'Client meeting refreshments', '2024-09-10', 3200, 512, 'Credit Card', 'pending'),
  (NULL, 'RCP-2024-004', 'Bolt Kenya', 'travel', 'Business transport services', '2024-09-12', 2800, 448, 'Mobile Money', 'approved'),
  (NULL, 'RCP-2024-005', 'DHL Kenya', 'office_supplies', 'Document shipping services', '2024-09-14', 5600, 896, 'Credit Card', 'pending')
) AS receipt_data(client_id, number, vendor_name, category, description, date, amount, tax_amount, payment_method, status)
ON CONFLICT DO NOTHING;

-- Show inserted data
SELECT 
  t.business_name,
  t.currency,
  t.timezone,
  t.default_payment_method,
  COUNT(DISTINCT c.id) as client_count,
  COUNT(DISTINCT r.id) as receipt_count
FROM tenants t
LEFT JOIN clients c ON c.tenant_id = t.id
LEFT JOIN receipts r ON r.tenant_id = t.id
WHERE t.slug = 'demo'
GROUP BY t.id, t.business_name, t.currency, t.timezone, t.default_payment_method;
