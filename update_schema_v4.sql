-- Add predictions column to analyses table
ALTER TABLE "analyses" 
ADD COLUMN IF NOT EXISTS "predictions" TEXT[] DEFAULT '{}';
