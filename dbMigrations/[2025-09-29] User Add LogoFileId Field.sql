-- =====================================================
-- Add LogoFileId Field to User Table
-- =====================================================
-- This script adds a LogoFileId UUID field to the User table
-- to store user logo image file references with foreign key to File table

-- =====================================================
-- User Table Changes
-- =====================================================

-- Step 1: Add LogoFileId column (only if it doesn't exist)
ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS "LogoFileId" UUID NULL;

-- Step 2: Add foreign key constraint to File table (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_User_LogoFileId' 
        AND table_name = 'User' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public."User" 
        ADD CONSTRAINT "FK_User_LogoFileId" 
        FOREIGN KEY ("LogoFileId") REFERENCES public."File"("Id");
    END IF;
END $$;

-- Step 3: Add comment to the column
COMMENT ON COLUMN public."User"."LogoFileId" IS 'User logo image file ID.';

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify the new LogoFileId column was added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'User' 
AND column_name = 'LogoFileId'
ORDER BY ordinal_position;

-- Verify the foreign key constraint was added
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'User'
AND tc.constraint_name = 'FK_User_LogoFileId';

-- Check the current state of User records
SELECT 
    "Id",
    "FirstName",
    "LastName",
    "Email",
    "CompanyName",
    "LogoFileId",
    "CreatedAt"
FROM public."User" 
WHERE "Deleted" = FALSE
ORDER BY "CreatedAt" DESC
LIMIT 10;

-- Count records with LogoFileId values
SELECT 
    COUNT(*) as total_records,
    COUNT("LogoFileId") as records_with_logo,
    COUNT(CASE WHEN "LogoFileId" IS NOT NULL THEN 1 END) as records_with_logo_populated,
    COUNT(CASE WHEN "LogoFileId" IS NULL THEN 1 END) as records_with_logo_empty
FROM public."User" 
WHERE "Deleted" = FALSE;

-- Show users with company names (most likely to have logos)
SELECT 
    u."Id",
    u."FirstName",
    u."LastName",
    u."Email",
    u."CompanyName",
    u."LogoFileId",
    f."FileName" as logo_filename,
    f."Key" as logo_s3_key,
    u."CreatedAt"
FROM public."User" u
LEFT JOIN public."File" f ON u."LogoFileId" = f."Id"
WHERE u."Deleted" = FALSE 
AND u."CompanyName" IS NOT NULL 
AND u."CompanyName" != ''
ORDER BY u."CreatedAt" DESC;

-- =====================================================
-- Notes
-- =====================================================
-- This migration:
-- 1. Adds LogoFileId UUID column to User table
-- 2. Field is nullable (optional) - for users who don't have a logo
-- 3. Foreign key constraint links to File table for data integrity
-- 4. Field will be used in Register and Account forms as Photo field type
-- 5. Logo images will be uploaded to AWS S3 and stored in File table
--
-- Usage:
-- - Register form: Users can optionally upload a logo when registering
-- - Account form: Users can add/edit their logo in account settings
-- - Field appears as Photo field type with same functionality as Customer MainImage
-- - Images are automatically resized to 800x600 WebP format before upload
-- - Supports camera capture, gallery selection, and file upload
-- - AWS S3 storage with signed URL generation for secure access
--
-- Related Components:
-- - JC_PhotoUpload component handles single image upload
-- - JC_FormTablet integrates Photo field type
-- - AWS S3 upload via /api/aws/saveFileToAws endpoint
-- - File metadata stored in File table with signed URL generation
