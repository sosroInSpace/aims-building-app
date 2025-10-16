-- =====================================================
-- Add Name Field to CustomerDefect Table
-- =====================================================
-- This script adds a Name field to the CustomerDefect table with unlimited varchar
-- and removes the 200 character limit from the Description field

-- =====================================================
-- CustomerDefect Table Changes
-- =====================================================

-- Step 1: Add Name column (only if it doesn't exist)
ALTER TABLE public."CustomerDefect" ADD COLUMN IF NOT EXISTS "Name" VARCHAR NULL;

-- Step 2: Remove character limit from Description field
ALTER TABLE public."CustomerDefect" ALTER COLUMN "Description" TYPE VARCHAR;

-- =====================================================
-- Data Migration
-- =====================================================

-- Step 3: Migrate existing Description values to Name field where Description is short (likely used as name)
-- Only migrate if Description is 50 characters or less and doesn't contain line breaks
UPDATE public."CustomerDefect" 
SET "Name" = "Description"
WHERE "Description" IS NOT NULL 
  AND LENGTH("Description") <= 50 
  AND "Description" NOT LIKE '%' || CHR(10) || '%'  -- No line breaks
  AND "Description" NOT LIKE '%' || CHR(13) || '%'  -- No carriage returns
  AND "Name" IS NULL;

-- Step 4: Clear Description for records that were migrated to Name (optional - uncomment if desired)
-- UPDATE public."CustomerDefect" 
-- SET "Description" = NULL
-- WHERE "Name" IS NOT NULL 
--   AND "Description" = "Name";

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify the new Name column was added successfully
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'CustomerDefect' 
AND column_name IN ('Name', 'Description')
ORDER BY ordinal_position;

-- Check the current state of CustomerDefect records
SELECT 
    "Id",
    "Name",
    "Description",
    LENGTH("Name") as name_length,
    LENGTH("Description") as description_length,
    "CreatedAt"
FROM public."CustomerDefect" 
WHERE "Deleted" = FALSE
ORDER BY "CreatedAt" DESC
LIMIT 10;

-- Count records with Name vs Description
SELECT 
    COUNT(*) as total_records,
    COUNT("Name") as records_with_name,
    COUNT("Description") as records_with_description,
    COUNT(CASE WHEN "Name" IS NOT NULL AND "Description" IS NOT NULL THEN 1 END) as records_with_both
FROM public."CustomerDefect" 
WHERE "Deleted" = FALSE;

-- =====================================================
-- Notes
-- =====================================================
-- This migration:
-- 1. Adds Name column with unlimited varchar to CustomerDefect table
-- 2. Removes the 200 character limit from Description field (makes it unlimited varchar)
-- 3. Migrates short Description values (≤50 chars, no line breaks) to Name field
-- 4. Maintains backward compatibility with existing data
-- 5. Both Name and Description fields are now unlimited varchar
--
-- The migration strategy:
-- - Name field: For short titles/names of defects
-- - Description field: For longer detailed descriptions
-- - UI will be updated to use Name field as the primary identifier
-- - Description remains for additional details
