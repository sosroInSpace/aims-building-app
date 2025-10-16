-- =====================================================
-- Convert Customer Single-Select Dropdown Fields to Multi-Select
-- =====================================================
-- This script converts Customer single-select dropdown fields to multi-select
-- by changing column names from *Code to *ListJson and migrating data
-- Note: CustomerDefect fields remain single-select

-- =====================================================
-- Customer Table Changes
-- =====================================================

-- Add new multi-select columns
ALTER TABLE public."Customer" ADD COLUMN "NumBedroomsListJson" VARCHAR NULL;
ALTER TABLE public."Customer" ADD COLUMN "OrientationListJson" VARCHAR NULL;
ALTER TABLE public."Customer" ADD COLUMN "StoreysListJson" VARCHAR NULL;
ALTER TABLE public."Customer" ADD COLUMN "FurnishedListJson" VARCHAR NULL;
ALTER TABLE public."Customer" ADD COLUMN "OccupiedListJson" VARCHAR NULL;
ALTER TABLE public."Customer" ADD COLUMN "FloorListJson" VARCHAR NULL;
ALTER TABLE public."Customer" ADD COLUMN "OtherBuildingElementsListJson" VARCHAR NULL;
ALTER TABLE public."Customer" ADD COLUMN "OtherTimberBldgElementsListJson" VARCHAR NULL;
ALTER TABLE public."Customer" ADD COLUMN "RoofListJson" VARCHAR NULL;
ALTER TABLE public."Customer" ADD COLUMN "WallsListJson" VARCHAR NULL;
ALTER TABLE public."Customer" ADD COLUMN "WeatherListJson" VARCHAR NULL;
ALTER TABLE public."Customer" ADD COLUMN "OverallConditionListJson" VARCHAR NULL;
ALTER TABLE public."Customer" ADD COLUMN "RiskOfUndetectedDefectsListJson" VARCHAR NULL;

-- Migrate data from single-select to multi-select format
-- Convert single codes to JSON arrays containing that single code
UPDATE public."Customer" SET "NumBedroomsListJson" = CASE 
    WHEN "NumBedroomsCode" IS NOT NULL THEN '["' || "NumBedroomsCode" || '"]'
    ELSE NULL 
END;

UPDATE public."Customer" SET "OrientationListJson" = CASE 
    WHEN "OrientationCode" IS NOT NULL THEN '["' || "OrientationCode" || '"]'
    ELSE NULL 
END;

UPDATE public."Customer" SET "StoreysListJson" = CASE 
    WHEN "StoreysCode" IS NOT NULL THEN '["' || "StoreysCode" || '"]'
    ELSE NULL 
END;

UPDATE public."Customer" SET "FurnishedListJson" = CASE 
    WHEN "FurnishedCode" IS NOT NULL THEN '["' || "FurnishedCode" || '"]'
    ELSE NULL 
END;

UPDATE public."Customer" SET "OccupiedListJson" = CASE 
    WHEN "OccupiedCode" IS NOT NULL THEN '["' || "OccupiedCode" || '"]'
    ELSE NULL 
END;

UPDATE public."Customer" SET "FloorListJson" = CASE 
    WHEN "FloorCode" IS NOT NULL THEN '["' || "FloorCode" || '"]'
    ELSE NULL 
END;

UPDATE public."Customer" SET "OtherBuildingElementsListJson" = CASE 
    WHEN "OtherBuildingElementsCode" IS NOT NULL THEN '["' || "OtherBuildingElementsCode" || '"]'
    ELSE NULL 
END;

UPDATE public."Customer" SET "OtherTimberBldgElementsListJson" = CASE 
    WHEN "OtherTimberBldgElementsCode" IS NOT NULL THEN '["' || "OtherTimberBldgElementsCode" || '"]'
    ELSE NULL 
END;

UPDATE public."Customer" SET "RoofListJson" = CASE 
    WHEN "RoofCode" IS NOT NULL THEN '["' || "RoofCode" || '"]'
    ELSE NULL 
END;

UPDATE public."Customer" SET "WallsListJson" = CASE 
    WHEN "WallsCode" IS NOT NULL THEN '["' || "WallsCode" || '"]'
    ELSE NULL 
END;

UPDATE public."Customer" SET "WeatherListJson" = CASE 
    WHEN "WeatherCode" IS NOT NULL THEN '["' || "WeatherCode" || '"]'
    ELSE NULL 
END;

UPDATE public."Customer" SET "OverallConditionListJson" = CASE 
    WHEN "OverallConditionCode" IS NOT NULL THEN '["' || "OverallConditionCode" || '"]'
    ELSE NULL 
END;

UPDATE public."Customer" SET "RiskOfUndetectedDefectsListJson" = CASE 
    WHEN "RiskOfUndetectedDefectsCode" IS NOT NULL THEN '["' || "RiskOfUndetectedDefectsCode" || '"]'
    ELSE NULL 
END;

-- Drop old single-select columns
ALTER TABLE public."Customer" DROP COLUMN "NumBedroomsCode";
ALTER TABLE public."Customer" DROP COLUMN "OrientationCode";
ALTER TABLE public."Customer" DROP COLUMN "StoreysCode";
ALTER TABLE public."Customer" DROP COLUMN "FurnishedCode";
ALTER TABLE public."Customer" DROP COLUMN "OccupiedCode";
ALTER TABLE public."Customer" DROP COLUMN "FloorCode";
ALTER TABLE public."Customer" DROP COLUMN "OtherBuildingElementsCode";
ALTER TABLE public."Customer" DROP COLUMN "OtherTimberBldgElementsCode";
ALTER TABLE public."Customer" DROP COLUMN "RoofCode";
ALTER TABLE public."Customer" DROP COLUMN "WallsCode";
ALTER TABLE public."Customer" DROP COLUMN "WeatherCode";
ALTER TABLE public."Customer" DROP COLUMN "OverallConditionCode";
ALTER TABLE public."Customer" DROP COLUMN "RiskOfUndetectedDefectsCode";


