-- Add standard_range column to metrics table
ALTER TABLE "metrics" 
ADD COLUMN IF NOT EXISTS "standard_range" TEXT;
