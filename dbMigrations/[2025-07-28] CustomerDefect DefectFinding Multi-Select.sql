-- =====================================================
-- Convert CustomerDefect DefectFindingCode to Multi-Select with Override Support
-- =====================================================
-- This script converts CustomerDefect DefectFindingCode field to multi-select
-- and updates the structure to support override functionality

-- =====================================================
-- CustomerDefect Table Changes
-- =====================================================

-- Step 1: Add new multi-select column (only if it doesn't exist)
ALTER TABLE public."CustomerDefect" ADD COLUMN IF NOT EXISTS "DefectFindingListJson" VARCHAR NULL;

-- Step 2: Migrate data from single-select to multi-select format with object structure
-- Convert single codes directly to the new object structure format (only if old column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public'
               AND table_name = 'CustomerDefect'
               AND column_name = 'DefectFindingCode') THEN

        UPDATE public."CustomerDefect" SET "DefectFindingListJson" = CASE
            WHEN "DefectFindingCode" IS NOT NULL THEN
                '[{"Code":"' || "DefectFindingCode" || '","NameOverride":null,"InformationOverride":null}]'
            ELSE NULL
        END
        WHERE "DefectFindingListJson" IS NULL; -- Only update if not already migrated

    END IF;
END $$;

-- Step 3: Drop old single-select column (only if it exists)
ALTER TABLE public."CustomerDefect" DROP COLUMN IF EXISTS "DefectFindingCode";

-- Step 4: Drop any old override columns if they exist
-- These columns are no longer needed as overrides are stored within the JSON structure
ALTER TABLE public."CustomerDefect" DROP COLUMN IF EXISTS "DefectFindingNameOverride";
ALTER TABLE public."CustomerDefect" DROP COLUMN IF EXISTS "DefectFindingInformationOverride";

-- =====================================================
-- Handle any existing multi-select data (if script is re-run)
-- =====================================================

-- Update any existing DefectFindingListJson that might be in simple array format
-- Convert from simple array of codes to array of objects with override properties
-- Only run this if the column exists and has data to convert
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public'
               AND table_name = 'CustomerDefect'
               AND column_name = 'DefectFindingListJson') THEN

        UPDATE public."CustomerDefect"
        SET "DefectFindingListJson" = CASE
            WHEN "DefectFindingListJson" IS NOT NULL
                 AND "DefectFindingListJson" != '[]'
                 AND "DefectFindingListJson" NOT LIKE '%"Code"%'
                 AND "DefectFindingListJson"::JSON IS NOT NULL THEN
                -- Convert existing codes array to objects array
                (
                    SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'Code', code_value,
                            'NameOverride', null,
                            'InformationOverride', null
                        )
                    )::TEXT
                    FROM JSON_ARRAY_ELEMENTS_TEXT("DefectFindingListJson"::JSON) AS code_value
                )
            ELSE "DefectFindingListJson"
        END
        WHERE "DefectFindingListJson" IS NOT NULL;

    END IF;
END $$;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify the migration results
-- SELECT
--     "Id",
--     "DefectFindingListJson",
--     "CreatedAt"
-- FROM public."CustomerDefect"
-- WHERE "DefectFindingListJson" IS NOT NULL
-- ORDER BY "CreatedAt" DESC
-- LIMIT 10;

-- Check for any records that might need manual review
-- SELECT
--     COUNT(*) as total_records,
--     COUNT("DefectFindingListJson") as records_with_defects,
--     SUM(CASE WHEN "DefectFindingListJson" LIKE '%"Code"%' THEN 1 ELSE 0 END) as records_with_object_structure
-- FROM public."CustomerDefect"
-- WHERE "Deleted" = FALSE;

-- =====================================================
-- Notes
-- =====================================================
-- This migration:
-- 1. Converts DefectFindingCode (single-select) to DefectFindingListJson (multi-select)
-- 2. Uses object structure: [{"Code":"code","NameOverride":null,"InformationOverride":null}]
-- 3. Migrates existing single-select data to the new multi-select object format
-- 4. Handles any existing multi-select data by converting simple arrays to object format
-- 5. Removes old separate override columns (DefectFindingNameOverride, DefectFindingInformationOverride)
-- 6. Maintains data integrity by preserving all existing defect finding selections
-- 7. Supports the new override functionality where users can manually override names and information
--
-- The new structure allows for:
-- - Multiple defect finding selections per defect
-- - Manual override of defect finding names
-- - Manual override of defect finding information
-- - Consistent structure with Building field
-- - Future extensibility for additional override fields