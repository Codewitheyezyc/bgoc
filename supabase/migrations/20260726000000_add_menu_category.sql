-- 20260726000000_add_menu_category.sql
-- Add menu_category column to products table for food/restaurant menu grouping

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS menu_category TEXT;
