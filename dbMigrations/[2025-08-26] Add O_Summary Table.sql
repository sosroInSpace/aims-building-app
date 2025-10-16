-- =====================================================
-- Migration: Add O_Summary Table
-- Date: 2025-08-26
-- Description: Create O_Summary table for storing reusable summary options
-- =====================================================

-- Create O_Summary table
CREATE TABLE IF NOT EXISTS public."O_Summary" (
    "Code" VARCHAR(50) NOT NULL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR NULL,
    "SortOrder" INT NOT NULL DEFAULT 999,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ModifiedAt" TIMESTAMP NULL,
    "Deleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Add some default summary options
INSERT INTO public."O_Summary" ("Code", "Name", "Description", "SortOrder", "CreatedAt") VALUES
('EXCELLENT', 'Excellent Condition', 'Property is in excellent condition with no significant defects noted.', 1, NOW()),
('GOOD', 'Good Condition', 'Property is in good condition with only minor maintenance items noted.', 2, NOW()),
('FAIR', 'Fair Condition', 'Property is in fair condition with some maintenance and repair items noted.', 3, NOW()),
('POOR', 'Poor Condition', 'Property is in poor condition with significant defects and repair items noted.', 4, NOW()),
('STANDARD_INSPECTION', 'Standard Inspection Summary', 'A comprehensive visual inspection was conducted in accordance with Australian Standards. All accessible areas were inspected and significant items have been noted in the body of this report.', 5, NOW()),
('WEATHER_LIMITED', 'Weather Limited Inspection', 'Inspection was conducted under adverse weather conditions which may have limited access to certain areas. All accessible areas were inspected to the extent possible.', 6, NOW()),
('ACCESS_LIMITED', 'Access Limited Inspection', 'Access to certain areas was limited due to occupancy, furniture, or structural constraints. All accessible areas were thoroughly inspected.', 7, NOW())
ON CONFLICT ("Code") DO NOTHING;

-- Create index for performance
CREATE INDEX IF NOT EXISTS "idx_o_summary_sortorder" ON public."O_Summary" ("SortOrder", "Name");
CREATE INDEX IF NOT EXISTS "idx_o_summary_deleted" ON public."O_Summary" ("Deleted");
