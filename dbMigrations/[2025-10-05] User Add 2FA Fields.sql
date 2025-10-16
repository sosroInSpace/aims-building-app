-- Migration: Add Two-Factor Authentication fields to User table
-- Date: 2025-10-05
-- Description: Adds Enable2fa, TwoFactorCode, and TwoFactorCodeExpiry fields to support 2FA functionality

-- Add Enable2fa field (default FALSE for new users)
ALTER TABLE public."User"
ADD COLUMN IF NOT EXISTS "Enable2fa" BOOLEAN NOT NULL DEFAULT FALSE;

-- Add TwoFactorCode field for storing verification codes
ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "TwoFactorCode" VARCHAR(10) NULL;

-- Add TwoFactorCodeExpiry field for code expiration timestamps
ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS "TwoFactorCodeExpiry" TIMESTAMP NULL;

-- Update existing users to have 2FA disabled by default
UPDATE public."User"
SET "Enable2fa" = FALSE
WHERE "Enable2fa" IS NULL;

-- Add comments to document the new fields
COMMENT ON COLUMN public."User"."Enable2fa" IS 'Whether 2FA is enabled for this user.';
COMMENT ON COLUMN public."User"."TwoFactorCode" IS 'Current 2FA verification code.';
COMMENT ON COLUMN public."User"."TwoFactorCodeExpiry" IS 'Expiry time for the current 2FA code.';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'User' 
  AND table_schema = 'public'
  AND column_name IN ('Enable2fa', 'TwoFactorCode', 'TwoFactorCodeExpiry')
ORDER BY column_name;
