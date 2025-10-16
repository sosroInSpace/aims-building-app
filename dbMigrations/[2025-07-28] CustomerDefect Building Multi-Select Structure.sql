-- =====================================================
-- Update CustomerDefect Building Field Structure
-- =====================================================
-- This script converts the BuildingCode field to BuildingListJson with multi-select support
-- and object structure for override functionality

-- =====================================================
-- CustomerDefect Table Changes
-- =====================================================

-- Step 1: Add the new BuildingListJson column if it doesn't exist
ALTER TABLE public."CustomerDefect" 
ADD COLUMN IF NOT EXISTS "BuildingListJson" VARCHAR NULL;

-- Step 2: Migrate existing BuildingCode data to BuildingListJson format
-- Convert single codes to JSON array format with Code and NameOverride structure
UPDATE public."CustomerDefect" 
SET "BuildingListJson" = CASE 
    WHEN "BuildingCode" IS NOT NULL AND "BuildingCode" != '' THEN 
        '[{"Code":"' || "BuildingCode" || '","NameOverride":null}]'
    ELSE 
        NULL 
END
WHERE "BuildingListJson" IS NULL;

-- Step 3: Drop the old BuildingCode column and its foreign key constraint
-- First drop the foreign key constraint
ALTER TABLE public."CustomerDefect" 
DROP CONSTRAINT IF EXISTS "CustomerDefect_BuildingCode_fkey";

-- Then drop the BuildingCode column
ALTER TABLE public."CustomerDefect" 
DROP COLUMN IF EXISTS "BuildingCode";

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify the migration results
-- SELECT 
--     "Id",
--     "BuildingListJson",
--     "DefectFindingListJson",
--     "CreatedAt"
-- FROM public."CustomerDefect" 
-- WHERE "BuildingListJson" IS NOT NULL
-- ORDER BY "CreatedAt" DESC
-- LIMIT 10;

-- Check for any records that might need manual review
-- SELECT 
--     COUNT(*) as total_records,
--     COUNT("BuildingListJson") as records_with_building,
--     COUNT("DefectFindingListJson") as records_with_defects
-- FROM public."CustomerDefect" 
-- WHERE "Deleted" = FALSE;

-- =====================================================
-- Notes
-- =====================================================
-- This migration:
-- 1. Adds BuildingListJson column for multi-select support
-- 2. Converts existing BuildingCode values to JSON object format: [{"Code":"code","NameOverride":null}]
-- 3. Removes the old BuildingCode column and its foreign key constraint
-- 4. Maintains data integrity by preserving all existing building selections
-- 5. Supports the new override functionality where users can manually override building names
--
-- The new structure allows for:
-- - Multiple building selections per defect
-- - Manual override of building names
-- - Consistent structure with DefectFinding field
-- - Future extensibility for additional override fields
