-- 20260719000002_auto_confirm_users.sql
-- Create a function to auto-confirm users
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public;

-- Drop trigger if exists and create it before insert on auth.users
DROP TRIGGER IF EXISTS on_auth_user_before_insert ON auth.users;

CREATE TRIGGER on_auth_user_before_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();
