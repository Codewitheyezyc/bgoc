-- 20260719000001_add_rejection_reason.sql
-- Add rejection_reason column to public.stores

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
