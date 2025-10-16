-- =======================================
-- MIGRATION: Add Detached Building Type
-- Table: O_BuildingType
-- Operation: INSERT
-- =======================================

-- ✅ SELECT before change
SELECT "Code", "Name", "SortOrder"
FROM public."O_BuildingType"
WHERE "Deleted" = FALSE
ORDER BY "SortOrder", "Name";

-- ✅ APPLY CHANGE
-- First, shift existing sort orders to make room for "Detached" at position 2
UPDATE public."O_BuildingType" 
SET "SortOrder" = "SortOrder" + 1
WHERE "SortOrder" >= 2 AND "Deleted" = FALSE;

-- Insert the new "Detached" building type
INSERT INTO public."O_BuildingType"
("Code", "Name", "SortOrder", "CreatedAt", "ModifiedAt", "Deleted")
VALUES
('Detached', 'Detached', 2, NOW(), NULL, FALSE);

-- ✅ SELECT after change
SELECT "Code", "Name", "SortOrder"
FROM public."O_BuildingType"
WHERE "Deleted" = FALSE
ORDER BY "SortOrder", "Name";

-- =======================================
-- ROLLBACK (COMMENTED OUT)
-- =======================================

-- -- ❌ SELECT before rollback
-- SELECT "Code", "Name", "SortOrder"
-- FROM public."O_BuildingType"
-- WHERE "Deleted" = FALSE
-- ORDER BY "SortOrder", "Name";

-- -- ❌ APPLY ROLLBACK
-- -- Remove the "Detached" building type
-- DELETE FROM public."O_BuildingType"
-- WHERE "Code" = 'Detached';

-- -- Shift sort orders back down
-- UPDATE public."O_BuildingType"
-- SET "SortOrder" = "SortOrder" - 1
-- WHERE "SortOrder" > 2 AND "Deleted" = FALSE;

-- -- ❌ SELECT after rollback
-- SELECT "Code", "Name", "SortOrder"
-- FROM public."O_BuildingType"
-- WHERE "Deleted" = FALSE
-- ORDER BY "SortOrder", "Name";

-- =======================================
-- END OF MIGRATION
-- =======================================
