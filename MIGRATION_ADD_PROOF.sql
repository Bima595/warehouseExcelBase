
-- Add payment_proof column to transactions table
ALTER TABLE transactions 
ADD COLUMN payment_proof TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions';
