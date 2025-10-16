-- =====================================================
-- Update CustomerDefect Area Field Structure
-- =====================================================
-- This script converts the AreaCode field to AreaListJson with multi-select support
-- and object structure for override functionality

-- =====================================================
-- CustomerDefect Table Changes
-- =====================================================

-- Step 1: Add the new AreaListJson column if it doesn't exist
ALTER TABLE public."CustomerDefect" 
ADD COLUMN IF NOT EXISTS "AreaListJson" VARCHAR NULL;

-- Step 2: Migrate existing AreaCode data to AreaListJson format
-- Convert single codes to JSON array format with Code and NameOverride structure
UPDATE public."CustomerDefect" 
SET "AreaListJson" = CASE 
    WHEN "AreaCode" IS NOT NULL AND "AreaCode" != '' THEN 
        '[{"Code":"' || "AreaCode" || '","NameOverride":null}]'
    ELSE 
        NULL 
END
WHERE "AreaListJson" IS NULL;

-- Step 3: Drop the old AreaCode column and its foreign key constraint
-- First drop the foreign key constraint
ALTER TABLE public."CustomerDefect" 
DROP CONSTRAINT IF EXISTS "CustomerDefect_AreaCode_fkey";

-- Then drop the AreaCode column
ALTER TABLE public."CustomerDefect" 
DROP COLUMN IF EXISTS "AreaCode";

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify the migration results
-- SELECT 
--     "Id",
--     "AreaListJson",
--     "CreatedAt"
-- FROM public."CustomerDefect" 
-- WHERE "AreaListJson" IS NOT NULL
-- ORDER BY "CreatedAt" DESC
-- LIMIT 10;

-- Check for any records that might need manual review
-- SELECT 
--     COUNT(*) as total_records,
--     COUNT("AreaListJson") as records_with_area
-- FROM public."CustomerDefect" 
-- WHERE "Deleted" = FALSE;

-- =====================================================
-- Notes
-- =====================================================
-- This migration:
-- 1. Adds AreaListJson column for multi-select support
-- 2. Converts existing AreaCode values to JSON object format: [{"Code":"code","NameOverride":null}]
-- 3. Removes the old AreaCode column and its foreign key constraint
-- 4. Maintains data integrity by preserving all existing area selections
-- 5. Supports the new override functionality where users can manually override area names
--
-- The new structure allows for:
-- - Multiple area selections per defect
-- - Manual override of area names
-- - Consistent structure with Building and DefectFinding fields
-- - Future extensibility for additional override fields
