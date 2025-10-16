-- =====================================================
-- Add Required Area Names for Default Sort Function
-- =====================================================
-- This script ensures that the area names used in the Defects page default sort function
-- exist in the O_Area table: Interior, Roof Void, Subfloor, Exterior, Outbuilding

-- =====================================================
-- O_Area Table Updates
-- =====================================================

-- Insert missing area names (only if they don't exist by name)
-- Using INSERT WHERE NOT EXISTS to check for existing names

-- Interior Area
INSERT INTO public."O_Area" ("Code", "Name", "SortOrder", "CreatedAt")
SELECT 'Interior', 'Interior', 10, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public."O_Area"
    WHERE "Name" = 'Interior' AND "Deleted" = FALSE
);

-- Roof Void Area
INSERT INTO public."O_Area" ("Code", "Name", "SortOrder", "CreatedAt")
SELECT 'RoofVoid', 'Roof Void', 11, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public."O_Area"
    WHERE "Name" = 'Roof Void' AND "Deleted" = FALSE
);

-- Subfloor Area
INSERT INTO public."O_Area" ("Code", "Name", "SortOrder", "CreatedAt")
SELECT 'Subfloor', 'Subfloor', 12, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public."O_Area"
    WHERE "Name" = 'Subfloor' AND "Deleted" = FALSE
);

-- Outbuilding Area
INSERT INTO public."O_Area" ("Code", "Name", "SortOrder", "CreatedAt")
SELECT 'Outbuilding', 'Outbuilding', 13, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public."O_Area"
    WHERE "Name" = 'Outbuilding' AND "Deleted" = FALSE
);

-- Note: "Exterior" already exists in the database with Code='Exterior', Name='Exterior', SortOrder=7

-- =====================================================
-- Update Sort Orders for Priority-Based Grouping
-- =====================================================
-- Update sort orders to reflect the priority used in the default sort function:
-- 1. Interior, 2. Roof Void, 3. Subfloor, 4. Exterior, 5. Outbuilding

-- Update priority areas (only if they exist)
UPDATE public."O_Area" SET "SortOrder" = 1, "ModifiedAt" = NOW()
WHERE "Name" = 'Interior' AND "Deleted" = FALSE;

UPDATE public."O_Area" SET "SortOrder" = 2, "ModifiedAt" = NOW()
WHERE "Name" = 'Roof Void' AND "Deleted" = FALSE;

UPDATE public."O_Area" SET "SortOrder" = 3, "ModifiedAt" = NOW()
WHERE "Name" = 'Subfloor' AND "Deleted" = FALSE;

UPDATE public."O_Area" SET "SortOrder" = 4, "ModifiedAt" = NOW()
WHERE "Name" = 'Exterior' AND "Deleted" = FALSE;

UPDATE public."O_Area" SET "SortOrder" = 5, "ModifiedAt" = NOW()
WHERE "Name" = 'Outbuilding' AND "Deleted" = FALSE;

-- Adjust existing areas to higher sort orders to maintain them after the priority areas
-- (only update if they exist and are not already in the priority group)
UPDATE public."O_Area" SET "SortOrder" = 10, "ModifiedAt" = NOW()
WHERE "Name" = 'Kitchen' AND "Deleted" = FALSE
AND "Name" NOT IN ('Interior', 'Roof Void', 'Subfloor', 'Exterior', 'Outbuilding');

UPDATE public."O_Area" SET "SortOrder" = 11, "ModifiedAt" = NOW()
WHERE "Name" = 'Bathroom' AND "Deleted" = FALSE
AND "Name" NOT IN ('Interior', 'Roof Void', 'Subfloor', 'Exterior', 'Outbuilding');

UPDATE public."O_Area" SET "SortOrder" = 12, "ModifiedAt" = NOW()
WHERE "Name" = 'Bedroom' AND "Deleted" = FALSE
AND "Name" NOT IN ('Interior', 'Roof Void', 'Subfloor', 'Exterior', 'Outbuilding');

UPDATE public."O_Area" SET "SortOrder" = 13, "ModifiedAt" = NOW()
WHERE "Name" = 'Living Room' AND "Deleted" = FALSE
AND "Name" NOT IN ('Interior', 'Roof Void', 'Subfloor', 'Exterior', 'Outbuilding');

UPDATE public."O_Area" SET "SortOrder" = 14, "ModifiedAt" = NOW()
WHERE "Name" = 'Laundry' AND "Deleted" = FALSE
AND "Name" NOT IN ('Interior', 'Roof Void', 'Subfloor', 'Exterior', 'Outbuilding');

UPDATE public."O_Area" SET "SortOrder" = 15, "ModifiedAt" = NOW()
WHERE "Name" = 'Garage' AND "Deleted" = FALSE
AND "Name" NOT IN ('Interior', 'Roof Void', 'Subfloor', 'Exterior', 'Outbuilding');

UPDATE public."O_Area" SET "SortOrder" = 16, "ModifiedAt" = NOW()
WHERE "Name" = 'Roof' AND "Deleted" = FALSE
AND "Name" NOT IN ('Interior', 'Roof Void', 'Subfloor', 'Exterior', 'Outbuilding');

UPDATE public."O_Area" SET "SortOrder" = 17, "ModifiedAt" = NOW()
WHERE "Name" = 'Other' AND "Deleted" = FALSE
AND "Name" NOT IN ('Interior', 'Roof Void', 'Subfloor', 'Exterior', 'Outbuilding');

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify all required area names exist
SELECT
    "Code",
    "Name",
    "SortOrder",
    "CreatedAt",
    "ModifiedAt"
FROM public."O_Area"
WHERE "Name" IN ('Interior', 'Roof Void', 'Subfloor', 'Exterior', 'Outbuilding')
AND "Deleted" = FALSE
ORDER BY "SortOrder";

-- Show all areas ordered by SortOrder
SELECT 
    "Code",
    "Name", 
    "SortOrder",
    "Deleted"
FROM public."O_Area" 
WHERE "Deleted" = FALSE
ORDER BY "SortOrder", "Name";

-- Count total areas
SELECT
    COUNT(*) as total_areas,
    COUNT(CASE WHEN "Name" IN ('Interior', 'Roof Void', 'Subfloor', 'Exterior', 'Outbuilding') THEN 1 END) as priority_areas
FROM public."O_Area"
WHERE "Deleted" = FALSE;

-- =====================================================
-- Notes
-- =====================================================
-- This migration:
-- 1. Adds missing area names required for the Defects page default sort function
-- 2. Sets appropriate sort orders to match the priority grouping logic
-- 3. Maintains existing area records by adjusting their sort orders
-- 4. Uses ON CONFLICT DO NOTHING to prevent duplicate insertions
--
-- Priority Areas (used in default sort):
-- 1. Interior (SortOrder: 1)
-- 2. Roof Void (SortOrder: 2) 
-- 3. Subfloor (SortOrder: 3)
-- 4. Exterior (SortOrder: 4) - already existed
-- 5. Outbuilding (SortOrder: 5)
--
-- The default sort function groups defects by these areas in this priority order,
-- then sorts alphabetically by defect name within each group.
