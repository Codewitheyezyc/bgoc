-- 20260720000000_food_vendor_schema.sql
-- Extension to support food, drinks, and restaurant vendors & product customizations

-- 1. Add food/restaurant fields to stores table
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{"open": "08:00", "close": "22:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}'::jsonb,
  ADD COLUMN IF NOT EXISTS avg_prep_time INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS cuisine_types TEXT[] DEFAULT '{}';

-- 2. Add food details & customization fields to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS food_details JSONB DEFAULT '{"spicy_level": "None", "dietary": [], "is_available": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS customizations JSONB DEFAULT '[]'::jsonb;
