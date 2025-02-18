-- Add report_type enum type
CREATE TYPE "ReportType" AS ENUM ('LAB_REPORT', 'PRESCRIPTION', 'RADIOLOGY', 'PATHOLOGY', 'OTHER');

-- Add columns to analyses table
ALTER TABLE "analyses" 
ADD COLUMN IF NOT EXISTS "report_type" "ReportType" DEFAULT 'LAB_REPORT',
ADD COLUMN IF NOT EXISTS "tags" TEXT[];

-- Update existing rows to have default values
UPDATE "analyses" SET "tags" = '{}' WHERE "tags" IS NULL;
