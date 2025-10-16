-- =====================================================
-- Update CustomerDefect Severity Field Structure
-- =====================================================
-- This script converts the SeverityCode field to SeverityListJson with multi-select support
-- and object structure for override functionality

-- =====================================================
-- CustomerDefect Table Changes
-- =====================================================

-- Step 1: Add the new SeverityListJson column if it doesn't exist
ALTER TABLE public."CustomerDefect" 
ADD COLUMN IF NOT EXISTS "SeverityListJson" VARCHAR NULL;

-- Step 2: Migrate existing SeverityCode data to SeverityListJson format
-- Convert single codes to JSON array format with Code and NameOverride structure
UPDATE public."CustomerDefect" 
SET "SeverityListJson" = CASE 
    WHEN "SeverityCode" IS NOT NULL AND "SeverityCode" != '' THEN 
        '[{"Code":"' || "SeverityCode" || '","NameOverride":null}]'
    ELSE 
        NULL 
END
WHERE "SeverityListJson" IS NULL;

-- Step 3: Drop the old SeverityCode column and its foreign key constraint
-- First drop the foreign key constraint
ALTER TABLE public."CustomerDefect" 
DROP CONSTRAINT IF EXISTS "CustomerDefect_SeverityCode_fkey";

-- Then drop the SeverityCode column
ALTER TABLE public."CustomerDefect" 
DROP COLUMN IF EXISTS "SeverityCode";

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify the migration results
-- SELECT 
--     "Id",
--     "SeverityListJson",
--     "CreatedAt"
-- FROM public."CustomerDefect" 
-- WHERE "SeverityListJson" IS NOT NULL
-- ORDER BY "CreatedAt" DESC
-- LIMIT 10;

-- Check for any records that might need manual review
-- SELECT 
--     COUNT(*) as total_records,
--     COUNT("SeverityListJson") as records_with_severity
-- FROM public."CustomerDefect" 
-- WHERE "Deleted" = FALSE;

-- =====================================================
-- Notes
-- =====================================================
-- This migration:
-- 1. Adds SeverityListJson column for multi-select support
-- 2. Converts existing SeverityCode values to JSON object format: [{"Code":"code","NameOverride":null}]
-- 3. Removes the old SeverityCode column and its foreign key constraint
-- 4. Maintains data integrity by preserving all existing severity selections
-- 5. Supports the new override functionality where users can manually override severity names
--
-- The new structure allows for:
-- - Multiple severity selections per defect
-- - Manual override of severity names
-- - Consistent structure with Building and DefectFinding fields
-- - Future extensibility for additional override fields
