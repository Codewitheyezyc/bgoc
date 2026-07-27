-- 20260727000001_fix_profiles_delete_and_unclaim_stores.sql
-- Fix foreign key constraints so profiles and auth.users can be deleted cleanly in Supabase dashboard

-- 1. Drop NOT NULL on stores.owner_user_id and set ON DELETE SET NULL
ALTER TABLE public.stores ALTER COLUMN owner_user_id DROP NOT NULL;
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_owner_user_id_fkey;

ALTER TABLE public.stores
  ADD CONSTRAINT stores_owner_user_id_fkey
  FOREIGN KEY (owner_user_id) REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- 2. Expand stores.approval_status check constraint to include 'unclaimed'
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_approval_status_check;

ALTER TABLE public.stores
  ADD CONSTRAINT stores_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'suspended', 'unclaimed'));

-- 3. Update orders.customer_user_id foreign key constraint to ON DELETE SET NULL
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_customer_user_id_fkey;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_customer_user_id_fkey
  FOREIGN KEY (customer_user_id) REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- 4. Trigger function to automatically revert store to 'unclaimed' when owner_user_id is set to NULL
CREATE OR REPLACE FUNCTION public.handle_store_owner_deleted()
RETURNS trigger AS $$
BEGIN
  IF NEW.owner_user_id IS NULL THEN
    NEW.approval_status = 'unclaimed';
    NEW.rejection_reason = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_store_owner_nullified ON public.stores;

CREATE TRIGGER on_store_owner_nullified
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_store_owner_deleted();

-- 5. Force reset all 7 stores in public.stores to unclaimed state
UPDATE public.stores
SET owner_user_id = NULL,
    approval_status = 'unclaimed',
    rejection_reason = NULL;
