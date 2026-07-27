-- 20260727000002_clean_slate_database.sql
-- Complete Clean Slate Reset Function

CREATE OR REPLACE FUNCTION public.clean_slate_database()
RETURNS void AS $$
BEGIN
  -- 1. Delete all order items, orders, and products
  DELETE FROM public.order_items;
  DELETE FROM public.orders;
  DELETE FROM public.products;

  -- 2. Clear store owners and reset approval_status to unclaimed on all stores
  UPDATE public.stores
  SET owner_user_id = NULL,
      approval_status = 'unclaimed',
      rejection_reason = NULL;

  -- 3. Delete non-admin profiles from public.profiles
  DELETE FROM public.profiles
  WHERE id NOT IN (
    SELECT id FROM auth.users WHERE email = 'beverlymealsandbakeries@gmail.com'
  );

  -- 4. Delete non-admin auth users from auth.users (if permissions allow)
  BEGIN
    DELETE FROM auth.users WHERE email != 'beverlymealsandbakeries@gmail.com';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 5. Ensure admin profile exists with role group_admin
  INSERT INTO public.profiles (id, full_name, role)
  SELECT id, 'Beverly Group Admin', 'group_admin'
  FROM auth.users
  WHERE email = 'beverlymealsandbakeries@gmail.com'
  ON CONFLICT (id) DO UPDATE SET role = 'group_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.clean_slate_database() TO anon, authenticated, service_role;

-- Run the clean slate function immediately upon migration
SELECT public.clean_slate_database();
