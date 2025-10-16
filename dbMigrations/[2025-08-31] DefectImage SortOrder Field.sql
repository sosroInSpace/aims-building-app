-- Migration: Add SortOrder column to DefectImage table
-- Date: 2025-08-31
-- Description: Adds SortOrder column to DefectImage table to enable photo ordering functionality

-- Add SortOrder column to DefectImage table
ALTER TABLE public."DefectImage" 
ADD COLUMN IF NOT EXISTS "SortOrder" INT NOT NULL DEFAULT 999;

-- Update existing records to have proper sort orders based on creation date
-- This ensures existing images maintain their current order
WITH ordered_images AS (
    SELECT 
        "Id",
        ROW_NUMBER() OVER (PARTITION BY "DefectId" ORDER BY "CreatedAt" ASC) as new_sort_order
    FROM public."DefectImage"
    WHERE "Deleted" = FALSE
)
UPDATE public."DefectImage" 
SET "SortOrder" = ordered_images.new_sort_order
FROM ordered_images
WHERE public."DefectImage"."Id" = ordered_images."Id";

-- Create index on SortOrder for better query performance
CREATE INDEX IF NOT EXISTS "IX_DefectImage_SortOrder" 
ON public."DefectImage" ("SortOrder");

-- Create composite index on DefectId and SortOrder for optimal ordering queries
CREATE INDEX IF NOT EXISTS "IX_DefectImage_DefectId_SortOrder" 
ON public."DefectImage" ("DefectId", "SortOrder");
