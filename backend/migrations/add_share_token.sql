-- Add share_token column to designs table for public sharing
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_designs_share_token ON designs(share_token);

-- Add comment
COMMENT ON COLUMN designs.share_token IS 'Unique token for public sharing of design';
