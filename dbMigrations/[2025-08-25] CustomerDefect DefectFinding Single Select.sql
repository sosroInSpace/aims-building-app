-- =====================================================
-- Migration: CustomerDefect DefectFinding Single Select
-- Date: 2025-08-25
-- Description: Convert DefectFindingListJson multi-select to DefectFindingCode single select
-- =====================================================

-- Add the new DefectFindingCode column
ALTER TABLE public."CustomerDefect"
ADD COLUMN IF NOT EXISTS "DefectFindingCode" varchar(50) NULL;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'FK_CustomerDefect_DefectFindingCode'
        AND table_name = 'CustomerDefect'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public."CustomerDefect"
        ADD CONSTRAINT "FK_CustomerDefect_DefectFindingCode"
        FOREIGN KEY ("DefectFindingCode") REFERENCES public."O_DefectFinding"("Code");
    END IF;
END $$;

-- Migrate existing data from DefectFindingListJson to DefectFindingCode
-- Take the first item from the JSON array as the single selection
-- Only run if DefectFindingListJson column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'CustomerDefect'
        AND column_name = 'DefectFindingListJson'
        AND table_schema = 'public'
    ) THEN
        -- Declare record variable
        DECLARE
            rec RECORD;
        BEGIN
            -- Update each record individually to avoid set-returning function issues
            FOR rec IN
                SELECT "Id", "DefectFindingListJson"
                FROM public."CustomerDefect"
                WHERE "DefectFindingListJson" IS NOT NULL
                  AND "DefectFindingListJson" != '[]'
                  AND "DefectFindingListJson" != 'null'
                  AND "DefectFindingCode" IS NULL
            LOOP
            BEGIN
                -- Extract first code from JSON array
                UPDATE public."CustomerDefect"
                SET "DefectFindingCode" = (
                    SELECT
                        CASE
                            -- Handle new object structure with Code property
                            WHEN json_typeof(first_element) = 'object' THEN
                                (first_element->>'Code')::varchar(50)
                            -- Handle old structure with just code strings
                            ELSE
                                first_element::text::varchar(50)
                        END
                    FROM (
                        SELECT json_array_elements(rec."DefectFindingListJson"::json) as first_element
                        LIMIT 1
                    ) sub
                )
                WHERE "Id" = rec."Id";
            EXCEPTION
                WHEN OTHERS THEN
                    -- Skip records with invalid JSON
                    CONTINUE;
            END;
        END LOOP;
        END;
    END IF;
END $$;

-- Drop the old columns after migration
ALTER TABLE public."CustomerDefect" 
DROP COLUMN IF EXISTS "DefectFindingListJson";

ALTER TABLE public."CustomerDefect" 
DROP COLUMN IF EXISTS "DefectFindingNameOverride";

ALTER TABLE public."CustomerDefect" 
DROP COLUMN IF EXISTS "DefectFindingInformationOverride";

-- =====================================================
-- Notes
-- =====================================================
-- This migration:
-- 1. Adds DefectFindingCode column as a single select foreign key to O_DefectFinding
-- 2. Migrates existing data by taking the first item from DefectFindingListJson arrays
-- 3. Handles both old (string array) and new (object array) JSON structures
-- 4. Removes the old multi-select DefectFindingListJson column
-- 5. Removes the override columns that are no longer needed
-- 6. The new single select approach simplifies the data model and UI
--
-- Breaking changes:
-- - Multi-select defect findings are now single select
-- - Override functionality is removed (can be added back if needed)
-- - Existing multi-select data is reduced to first selection only
