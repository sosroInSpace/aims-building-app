-- =====================================================
-- Update CustomerDefect Location Field Structure
-- =====================================================
-- This script converts the LocationCode field to LocationListJson with multi-select support
-- and object structure for override functionality

-- =====================================================
-- CustomerDefect Table Changes
-- =====================================================

-- Step 1: Add the new LocationListJson column if it doesn't exist
ALTER TABLE public."CustomerDefect" 
ADD COLUMN IF NOT EXISTS "LocationListJson" VARCHAR NULL;

-- Step 2: Migrate existing LocationCode data to LocationListJson format
-- Convert single codes to JSON array format with Code and NameOverride structure
UPDATE public."CustomerDefect" 
SET "LocationListJson" = CASE 
    WHEN "LocationCode" IS NOT NULL AND "LocationCode" != '' THEN 
        '[{"Code":"' || "LocationCode" || '","NameOverride":null}]'
    ELSE 
        NULL 
END
WHERE "LocationListJson" IS NULL;

-- Step 3: Drop the old LocationCode column and its foreign key constraint
-- First drop the foreign key constraint
ALTER TABLE public."CustomerDefect" 
DROP CONSTRAINT IF EXISTS "CustomerDefect_LocationCode_fkey";

-- Then drop the LocationCode column
ALTER TABLE public."CustomerDefect" 
DROP COLUMN IF EXISTS "LocationCode";

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify the migration results
-- SELECT 
--     "Id",
--     "LocationListJson",
--     "CreatedAt"
-- FROM public."CustomerDefect" 
-- WHERE "LocationListJson" IS NOT NULL
-- ORDER BY "CreatedAt" DESC
-- LIMIT 10;

-- Check for any records that might need manual review
-- SELECT 
--     COUNT(*) as total_records,
--     COUNT("LocationListJson") as records_with_location
-- FROM public."CustomerDefect" 
-- WHERE "Deleted" = FALSE;

-- =====================================================
-- Notes
-- =====================================================
-- This migration:
-- 1. Adds LocationListJson column for multi-select support
-- 2. Converts existing LocationCode values to JSON object format: [{"Code":"code","NameOverride":null}]
-- 3. Removes the old LocationCode column and its foreign key constraint
-- 4. Maintains data integrity by preserving all existing location selections
-- 5. Supports the new override functionality where users can manually override location names
--
-- The new structure allows for:
-- - Multiple location selections per defect
-- - Manual override of location names
-- - Consistent structure with Building and DefectFinding fields
-- - Future extensibility for additional override fields
