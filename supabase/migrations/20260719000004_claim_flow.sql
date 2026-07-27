-- 20260719000004_claim_flow.sql
-- Adds 'unclaimed' approval status and makes owner_user_id nullable
-- This enables Isaac to pre-load founding store shells before managers claim them.

-- 1. Drop the NOT NULL constraint on owner_user_id so admin can create shells
ALTER TABLE public.stores
  ALTER COLUMN owner_user_id DROP NOT NULL;

-- 2. Expand the approval_status CHECK constraint to include 'unclaimed'
ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_approval_status_check;

ALTER TABLE public.stores
  ADD CONSTRAINT stores_approval_status_check
  CHECK (approval_status IN ('unclaimed', 'pending', 'approved', 'suspended'));

-- 3. Add RLS INSERT policy so group_admin can create unclaimed shell rows
--    (owner_user_id = null means no restriction on the auth.uid() = owner_user_id check)
DROP POLICY IF EXISTS "Allow group_admin to insert unclaimed shells" ON public.stores;

CREATE POLICY "Allow group_admin to insert unclaimed shells"
  ON public.stores FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() = 'group_admin');

-- 4. Add SELECT policy so anyone (including anon) can see unclaimed stores
--    so they show up on the /register/details claim grid
DROP POLICY IF EXISTS "Allow public select for unclaimed stores" ON public.stores;

CREATE POLICY "Allow public select for unclaimed stores"
  ON public.stores FOR SELECT
  USING (approval_status = 'unclaimed');

-- 5. Allow group_admin UPDATE to set owner_user_id on unclaimed stores
--    (existing "Allow group_admin full control on stores" already covers this)

-- 6. Allow an authenticated store_manager to UPDATE an unclaimed store to claim it
--    (set their own owner_user_id + fill in details, flip to pending)
DROP POLICY IF EXISTS "Allow managers to claim unclaimed stores" ON public.stores;

CREATE POLICY "Allow managers to claim unclaimed stores"
  ON public.stores FOR UPDATE
  TO authenticated
  USING (
    approval_status = 'unclaimed'
    AND owner_user_id IS NULL
  )
  WITH CHECK (
    auth.uid() = owner_user_id
  );
