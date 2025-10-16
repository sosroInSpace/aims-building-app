-- =====================================================
-- Remove Description Field from CustomerDefect Table
-- =====================================================
-- This script removes the Description field from the CustomerDefect table
-- as it has been replaced by the Name field

-- =====================================================
-- CustomerDefect Table Changes
-- =====================================================

-- Step 1: Drop the Description column
ALTER TABLE public."CustomerDefect" DROP COLUMN IF EXISTS "Description";

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify the Description column was removed successfully
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'CustomerDefect' 
ORDER BY ordinal_position;

-- Check the current state of CustomerDefect records
SELECT 
    "Id",
    "Name",
    LENGTH("Name") as name_length,
    "CreatedAt"
FROM public."CustomerDefect" 
WHERE "Deleted" = FALSE
ORDER BY "CreatedAt" DESC
LIMIT 10;

-- Count records with Name
SELECT 
    COUNT(*) as total_records,
    COUNT("Name") as records_with_name
FROM public."CustomerDefect" 
WHERE "Deleted" = FALSE;

-- =====================================================
-- Notes
-- =====================================================
-- This migration:
-- 1. Removes the Description column from CustomerDefect table
-- 2. The Name field is now the primary display field for defects
-- 3. All UI and API code has been updated to use Name instead of Description
-- 4. This completes the transition from Description to Name field
