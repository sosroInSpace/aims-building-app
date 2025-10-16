-- =====================================================
-- Add DefectFinding Override Fields to CustomerDefect Table
-- =====================================================
-- This script adds DefectFindingNameOverride and DefectFindingInformationOverride
-- fields to the CustomerDefect table to support manual override functionality
-- for defect finding names and information.

-- =====================================================
-- CustomerDefect Table Changes
-- =====================================================

-- Step 1: Add DefectFindingNameOverride column (only if it doesn't exist)
ALTER TABLE public."CustomerDefect" ADD COLUMN IF NOT EXISTS "DefectFindingNameOverride" VARCHAR NULL;

-- Step 2: Add DefectFindingInformationOverride column (only if it doesn't exist)
ALTER TABLE public."CustomerDefect" ADD COLUMN IF NOT EXISTS "DefectFindingInformationOverride" VARCHAR NULL;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify the new columns were added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'CustomerDefect' 
AND column_name IN ('DefectFindingNameOverride', 'DefectFindingInformationOverride')
ORDER BY column_name;

-- Check the current state of CustomerDefect records
SELECT 
    "Id",
    "Description",
    "DefectFindingCode",
    "DefectFindingNameOverride",
    "DefectFindingInformationOverride",
    "CreatedAt"
FROM public."CustomerDefect" 
WHERE "Deleted" = FALSE
ORDER BY "CreatedAt" DESC
LIMIT 10;

-- Count records and new override fields
SELECT 
    COUNT(*) as total_records,
    COUNT("DefectFindingNameOverride") as records_with_name_override,
    COUNT("DefectFindingInformationOverride") as records_with_info_override,
    COUNT("DefectFindingCode") as records_with_defect_finding
FROM public."CustomerDefect" 
WHERE "Deleted" = FALSE;

-- =====================================================
-- Notes
-- =====================================================
-- This migration:
-- 1. Adds DefectFindingNameOverride column to store manual override name for defect findings
-- 2. Adds DefectFindingInformationOverride column to store manual override information for defect findings
-- 3. These fields work alongside the existing DefectFindingCode field
-- 4. The new fields will be populated through the UI when users use the manual override feature
-- 5. The PDF generation and display logic will prioritize these fields when available
-- 6. Maintains backward compatibility with existing DefectFindingCode structure
--
-- The new override behavior:
-- - Manual override modal shows Name and Information fields for defect findings
-- - When fields are empty on modal load, they can auto-populate with existing defect finding data
-- - PDF and display logic uses these fields when available, falls back to DefectFindingCode lookup
-- - Pencil buttons now appear in the Defects column for manual override functionality
