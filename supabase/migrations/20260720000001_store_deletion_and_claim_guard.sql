-- 20260720000001_store_deletion_and_claim_guard.sql
-- Handle vendor account deletion & double-claim prevention

-- 1. Modify stores.owner_user_id foreign key constraint to ON DELETE SET NULL
ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_owner_user_id_fkey;

ALTER TABLE public.stores
  ADD CONSTRAINT stores_owner_user_id_fkey
  FOREIGN KEY (owner_user_id) REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- 2. Trigger function to revert store to 'unclaimed' when owner_user_id becomes NULL
CREATE OR REPLACE FUNCTION public.handle_store_owner_deleted()
RETURNS trigger AS $$
BEGIN
  IF NEW.owner_user_id IS NULL AND OLD.owner_user_id IS NOT NULL THEN
    NEW.approval_status = 'unclaimed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_store_owner_nullified ON public.stores;

CREATE TRIGGER on_store_owner_nullified
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_store_owner_deleted();
