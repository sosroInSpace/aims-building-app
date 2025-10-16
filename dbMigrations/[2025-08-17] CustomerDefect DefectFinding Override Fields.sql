-- =====================================================
-- Add DefectFinding Override Fields to CustomerDefect Table
-- =====================================================
-- This script adds DefectFindingNameOverride and DefectFindingInformationOverride
-- fields to the CustomerDefect table to support single override values
-- that represent all selected defect findings

-- =====================================================
-- CustomerDefect Table Changes
-- =====================================================

-- Step 1: Add DefectFindingNameOverride column (only if it doesn't exist)
ALTER TABLE public."CustomerDefect" ADD COLUMN IF NOT EXISTS "DefectFindingNameOverride" VARCHAR NULL;

-- Step 2: Add DefectFindingInformationOverride column (only if it doesn't exist)
ALTER TABLE public."CustomerDefect" ADD COLUMN IF NOT EXISTS "DefectFindingInformationOverride" VARCHAR NULL;

-- =====================================================
-- Data Migration (Optional)
-- =====================================================
-- This section can be used to migrate existing override data from the JSON structure
-- to the new dedicated fields if needed. Currently commented out as the new fields
-- will be populated through the UI when users interact with the manual override feature.

/*
-- Migrate existing override data from DefectFindingListJson to the new fields
-- This extracts the first item's override values from the JSON structure
DO $$
BEGIN
    UPDATE public."CustomerDefect" 
    SET 
        "DefectFindingNameOverride" = CASE
            WHEN "DefectFindingListJson" IS NOT NULL THEN
                (SELECT (json_array_elements("DefectFindingListJson"::json)->>'NameOverride')::varchar
                 FROM (SELECT "DefectFindingListJson"::json) AS j
                 WHERE json_array_length("DefectFindingListJson"::json) > 0
                 AND (json_array_elements("DefectFindingListJson"::json)->>'NameOverride') IS NOT NULL
                 LIMIT 1)
            ELSE NULL
        END,
        "DefectFindingInformationOverride" = CASE
            WHEN "DefectFindingListJson" IS NOT NULL THEN
                (SELECT (json_array_elements("DefectFindingListJson"::json)->>'InformationOverride')::varchar
                 FROM (SELECT "DefectFindingListJson"::json) AS j
                 WHERE json_array_length("DefectFindingListJson"::json) > 0
                 AND (json_array_elements("DefectFindingListJson"::json)->>'InformationOverride') IS NOT NULL
                 LIMIT 1)
            ELSE NULL
        END
    WHERE "DefectFindingNameOverride" IS NULL 
    AND "DefectFindingInformationOverride" IS NULL
    AND "DefectFindingListJson" IS NOT NULL
    AND "DefectFindingListJson" != '[]'
    AND "DefectFindingListJson" != 'null';

EXCEPTION
    WHEN OTHERS THEN
        -- If JSON parsing fails, continue without error
        -- The new fields will remain NULL and can be populated through the UI
        NULL;
END $$;
*/

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify the new columns were added successfully
-- SELECT 
--     column_name, 
--     data_type, 
--     is_nullable
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'CustomerDefect' 
-- AND column_name IN ('DefectFindingNameOverride', 'DefectFindingInformationOverride')
-- ORDER BY column_name;

-- Check the current state of CustomerDefect records
-- SELECT 
--     "Id",
--     "Description",
--     "DefectFindingListJson",
--     "DefectFindingNameOverride",
--     "DefectFindingInformationOverride",
--     "CreatedAt"
-- FROM public."CustomerDefect" 
-- WHERE "Deleted" = FALSE
-- ORDER BY "CreatedAt" DESC
-- LIMIT 10;

-- Count records with override values
-- SELECT 
--     COUNT(*) as total_records,
--     COUNT("DefectFindingNameOverride") as records_with_name_override,
--     COUNT("DefectFindingInformationOverride") as records_with_info_override,
--     COUNT("DefectFindingListJson") as records_with_defect_findings
-- FROM public."CustomerDefect" 
-- WHERE "Deleted" = FALSE;

-- =====================================================
-- Notes
-- =====================================================
-- This migration:
-- 1. Adds DefectFindingNameOverride column to store single override name for all selected defect findings
-- 2. Adds DefectFindingInformationOverride column to store single override information for all selected defect findings
-- 3. These fields work alongside the existing DefectFindingListJson field
-- 4. The new fields will be populated through the UI when users use the manual override feature
-- 5. The PDF generation will prioritize these fields over the JSON structure overrides
-- 6. Maintains backward compatibility with existing DefectFindingListJson structure
--
-- The new override behavior:
-- - Manual override modal shows single Name and Information fields (not per selection)
-- - When fields are empty on modal load, they auto-populate with:
--   * Name: comma-separated names of all selected options
--   * Information: " - " separated information of all selected options
-- - PDF uses these fields when available, falls back to JSON structure for compatibility
