-- Add client_id to receipts table to link receipts with clients
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

-- Add payment_method column to receipts table
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'Cash' 
CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Mobile Money', 'Check', 'Other'));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_receipts_client_id ON receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_method ON receipts(payment_method);

-- Add comment for documentation
COMMENT ON COLUMN receipts.client_id IS 'Optional reference to client when receipt is from an existing client';
COMMENT ON COLUMN receipts.payment_method IS 'Payment method used for this receipt transaction';
