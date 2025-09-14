-- Add missing columns to existing client_communications table
ALTER TABLE client_communications 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS date timestamptz DEFAULT now();

-- Create index for the new date column
CREATE INDEX IF NOT EXISTS idx_client_communications_date ON client_communications(date);

-- Update existing records to have a default date if they don't have one
UPDATE client_communications 
SET date = created_at 
WHERE date IS NULL;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_client_communications_updated_at ON client_communications;
CREATE TRIGGER update_client_communications_updated_at
    BEFORE UPDATE ON client_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();