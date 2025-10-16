-- =====================================================
-- Add ReportTypeListJson Field to User Table
-- =====================================================
-- This script adds the ReportTypeListJson field to the User table
-- to store a JSON array of O_ReportType codes that can be selected for a user

-- =====================================================
-- User Table Changes
-- =====================================================

-- Add new ReportTypeListJson column
ALTER TABLE public."User" ADD COLUMN "ReportTypeListJson" TEXT NULL;

-- Add comment to document the field purpose
COMMENT ON COLUMN public."User"."ReportTypeListJson" IS 'JSON array of O_ReportType codes that can be selected for a user.';

-- =====================================================
-- Migration Complete
-- =====================================================
-- The ReportTypeListJson field has been added to the User table
-- This field will store user qualifications as a JSON array of report type codes
-- Example value: ["PrePurchStructOnly", "PrePurchComprehensive", "StructuralIntegrity"]
