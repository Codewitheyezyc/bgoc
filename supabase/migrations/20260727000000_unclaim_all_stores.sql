-- 20260727000000_unclaim_all_stores.sql
-- Reset all 7 stores in public.stores to unclaimed state

UPDATE public.stores
SET owner_user_id = NULL,
    approval_status = 'unclaimed',
    rejection_reason = NULL;

-- Security Definer RPC function to allow unclaiming all stores via API/admin
CREATE OR REPLACE FUNCTION public.reset_all_stores_unclaimed()
RETURNS void AS $$
BEGIN
  UPDATE public.stores
  SET owner_user_id = NULL,
      approval_status = 'unclaimed',
      rejection_reason = NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.reset_all_stores_unclaimed() TO anon, authenticated, service_role;
