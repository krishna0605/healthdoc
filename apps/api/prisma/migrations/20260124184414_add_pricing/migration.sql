-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('BASIC', 'PRO', 'FAMILY');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('LAB_REPORT', 'PRESCRIPTION', 'RADIOLOGY', 'PATHOLOGY', 'OTHER');

-- AlterTable
ALTER TABLE "analyses" ADD COLUMN     "predictions" TEXT[],
ADD COLUMN     "report_type" "ReportType" NOT NULL DEFAULT 'LAB_REPORT',
ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "metrics" ADD COLUMN     "standard_range" TEXT;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "last_usage_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "monthly_upload_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "plan_tier" "PlanTier" NOT NULL DEFAULT 'BASIC';
