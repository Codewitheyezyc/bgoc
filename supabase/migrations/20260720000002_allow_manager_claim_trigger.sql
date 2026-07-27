-- 20260720000002_allow_manager_claim_trigger.sql
-- Allow store managers to update store approval status from 'unclaimed' -> 'pending' or 'suspended' -> 'pending'

CREATE OR REPLACE FUNCTION public.check_store_approval_status()
RETURNS trigger AS $$
BEGIN
  IF (OLD.approval_status IS DISTINCT FROM NEW.approval_status) THEN
    -- Group admins can change status to anything (approved, suspended, pending, unclaimed)
    IF public.get_my_role() = 'group_admin' THEN
      RETURN NEW;
    END IF;

    -- Store managers / claiming users can ONLY change 'unclaimed' -> 'pending' or 'suspended' -> 'pending'
    IF (OLD.approval_status = 'unclaimed' AND NEW.approval_status = 'pending') OR
       (OLD.approval_status = 'suspended' AND NEW.approval_status = 'pending') THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Only group admins can approve stores or change status to %', NEW.approval_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
