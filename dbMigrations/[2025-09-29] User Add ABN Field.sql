-- =====================================================
-- Add ABN Field to User Table
-- =====================================================
-- This script adds an ABN (Australian Business Number) varchar(20) field to the User table
-- to store business registration numbers for company users

-- =====================================================
-- User Table Changes
-- =====================================================

-- Step 1: Add ABN column (only if it doesn't exist)
ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS "ABN" VARCHAR(20) NULL;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify the new ABN column was added successfully
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'User' 
AND column_name = 'ABN'
ORDER BY ordinal_position;

-- Check the current state of User records
SELECT 
    "Id",
    "FirstName",
    "LastName",
    "Email",
    "CompanyName",
    "ABN",
    "CreatedAt"
FROM public."User" 
WHERE "Deleted" = FALSE
ORDER BY "CreatedAt" DESC
LIMIT 10;

-- Count records with ABN values
SELECT 
    COUNT(*) as total_records,
    COUNT("ABN") as records_with_abn,
    COUNT(CASE WHEN "ABN" IS NOT NULL AND "ABN" != '' THEN 1 END) as records_with_abn_populated,
    COUNT(CASE WHEN "ABN" IS NULL OR "ABN" = '' THEN 1 END) as records_with_abn_empty
FROM public."User" 
WHERE "Deleted" = FALSE;

-- Show users with company names (most likely to need ABN)
SELECT 
    "Id",
    "FirstName",
    "LastName",
    "Email",
    "CompanyName",
    "ABN",
    "CreatedAt"
FROM public."User" 
WHERE "Deleted" = FALSE 
AND "CompanyName" IS NOT NULL 
AND "CompanyName" != ''
ORDER BY "CreatedAt" DESC;

-- =====================================================
-- Notes
-- =====================================================
-- This migration:
-- 1. Adds ABN varchar(20) column to User table
-- 2. Field is nullable (optional) - for users who don't have a business
-- 3. ABN stands for Australian Business Number
-- 4. Field will be used in Register and Account forms after Company field
-- 5. Maximum length of 20 characters accommodates ABN format (11 digits + formatting)
--
-- Usage:
-- - Register form: Users can optionally enter their ABN when registering
-- - Account form: Users can add/edit their ABN in account settings
-- - Field appears after Company Name field in both forms
-- - Validation can be added later if needed for ABN format checking
