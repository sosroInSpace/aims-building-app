-- =====================================================
-- Add CustomOrder Field to Customer Table
-- =====================================================
-- This script adds a CustomOrder boolean field to the Customer table
-- to persist the "Custom Order" checkbox state for the Defects page

-- =====================================================
-- Customer Table Changes
-- =====================================================

-- Step 1: Add CustomOrder column (only if it doesn't exist)
ALTER TABLE public."Customer" ADD COLUMN IF NOT EXISTS "CustomOrder" BOOLEAN NULL;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify the new CustomOrder column was added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'Customer' 
AND column_name = 'CustomOrder'
ORDER BY ordinal_position;

-- Check the current state of Customer records
SELECT 
    "Id",
    "ClientName",
    "Address",
    "CustomOrder",
    "CreatedAt"
FROM public."Customer" 
WHERE "Deleted" = FALSE
ORDER BY "CreatedAt" DESC
LIMIT 10;

-- Count records with CustomOrder values
SELECT 
    COUNT(*) as total_records,
    COUNT("CustomOrder") as records_with_custom_order,
    COUNT(CASE WHEN "CustomOrder" = TRUE THEN 1 END) as records_with_custom_order_true,
    COUNT(CASE WHEN "CustomOrder" = FALSE THEN 1 END) as records_with_custom_order_false,
    COUNT(CASE WHEN "CustomOrder" IS NULL THEN 1 END) as records_with_custom_order_null
FROM public."Customer" 
WHERE "Deleted" = FALSE;

-- =====================================================
-- Notes
-- =====================================================
-- This migration:
-- 1. Adds CustomOrder boolean column to Customer table
-- 2. Field is nullable (optional) - NULL means use default behavior
-- 3. TRUE means use custom SortOrder-based sorting on Defects page
-- 4. FALSE means use default sorting (e.g., alphabetical by name)
-- 5. The Defects page will read this value to set the initial state of the "Custom Order" checkbox
-- 6. When the checkbox is toggled, the Customer record will be updated with the new preference
--
-- Usage:
-- - NULL or TRUE: Show "Custom Order" checkbox as checked, use SortOrder-based sorting
-- - FALSE: Show "Custom Order" checkbox as unchecked, use default sorting function
