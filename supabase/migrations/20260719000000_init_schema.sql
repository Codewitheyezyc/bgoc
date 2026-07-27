-- 20260719000000_init_schema.sql
-- Database initialization for Beverly Group of Companies (BGOC)

-- Enable pgcrypto extension if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  default_address TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'store_manager', 'group_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper function to get role without circular recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Automatically create profile when a new user registers in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, default_address, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'default_address', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Stores Table
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('food', 'fashion', 'toys', 'home')),
  description TEXT,
  logo_url TEXT,
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('instant', 'shippable')),
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Automatically upgrade profile role to 'store_manager' when they successfully register a store
CREATE OR REPLACE FUNCTION public.handle_store_creation()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'store_manager'
  WHERE id = new.owner_user_id AND role = 'customer';
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_store_created
  AFTER INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.handle_store_creation();

-- Enforce that only group admins can modify a store's approval status
CREATE OR REPLACE FUNCTION public.check_store_approval_status()
RETURNS trigger AS $$
BEGIN
  IF (OLD.approval_status IS DISTINCT FROM NEW.approval_status) AND (public.get_my_role() IS DISTINCT FROM 'group_admin') THEN
    RAISE EXCEPTION 'Only group admins can modify approval status';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_store_update_approval
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.check_store_approval_status();

-- 3. Products Table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  stock_quantity INTEGER CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  size_options JSONB, -- For sizing like Celebrity Styles
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Orders Table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  delivery_address TEXT NOT NULL,
  paystack_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Automatically set updated_at on orders update
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enforce status updates rules (customers can only cancel a pending order)
CREATE OR REPLACE FUNCTION public.check_order_status_update()
RETURNS trigger AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    IF public.get_my_role() = 'customer' THEN
      IF NEW.status = 'cancelled' AND OLD.status = 'pending' THEN
        NULL; -- allowed
      ELSE
        RAISE EXCEPTION 'Customers can only cancel pending orders';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_order_status_update
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.check_order_status_update();

-- 5. Order Items Table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  size_selected TEXT,
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0)
);


-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for self, managers, and admins" 
  ON public.profiles FOR SELECT 
  TO authenticated 
  USING (
    auth.uid() = id 
    OR public.get_my_role() IN ('group_admin', 'store_manager')
  );

CREATE POLICY "Allow users to update own profile" 
  ON public.profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow group_admin full control on profiles" 
  ON public.profiles FOR ALL 
  TO authenticated 
  USING (public.get_my_role() = 'group_admin') 
  WITH CHECK (public.get_my_role() = 'group_admin');


-- Stores RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select for approved stores" 
  ON public.stores FOR SELECT 
  USING (approval_status = 'approved');

CREATE POLICY "Allow managers to select their own stores" 
  ON public.stores FOR SELECT 
  TO authenticated 
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Allow group_admin to select all stores" 
  ON public.stores FOR SELECT 
  TO authenticated 
  USING (public.get_my_role() = 'group_admin');

CREATE POLICY "Allow managers and admins to insert stores" 
  ON public.stores FOR INSERT 
  TO authenticated 
  WITH CHECK (
    auth.uid() = owner_user_id 
    AND (public.get_my_role() IN ('store_manager', 'customer') OR public.get_my_role() IS NULL)
  );

CREATE POLICY "Allow managers to update their own stores" 
  ON public.stores FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = owner_user_id) 
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Allow group_admin full control on stores" 
  ON public.stores FOR ALL 
  TO authenticated 
  USING (public.get_my_role() = 'group_admin') 
  WITH CHECK (public.get_my_role() = 'group_admin');


-- Products RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select for products of approved stores" 
  ON public.products FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.id = store_id AND s.approval_status = 'approved'
    )
  );

CREATE POLICY "Allow managers to select products of their own stores" 
  ON public.products FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.id = store_id AND s.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Allow group_admin to select all products" 
  ON public.products FOR SELECT 
  TO authenticated 
  USING (public.get_my_role() = 'group_admin');

CREATE POLICY "Allow managers to insert products for their own stores" 
  ON public.products FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.id = store_id AND s.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Allow managers to update products of their own stores" 
  ON public.products FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.id = store_id AND s.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.id = store_id AND s.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Allow managers to delete products of their own stores" 
  ON public.products FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.id = store_id AND s.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Allow group_admin full control on products" 
  ON public.products FOR ALL 
  TO authenticated 
  USING (public.get_my_role() = 'group_admin') 
  WITH CHECK (public.get_my_role() = 'group_admin');


-- Orders RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow customers to select their own orders" 
  ON public.orders FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Allow managers to select orders of their own stores" 
  ON public.orders FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.id = store_id AND s.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Allow group_admin to select all orders" 
  ON public.orders FOR SELECT 
  TO authenticated 
  USING (public.get_my_role() = 'group_admin');

CREATE POLICY "Allow customers to insert their own orders" 
  ON public.orders FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow customers to update their own orders" 
  ON public.orders FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow managers to update orders of their own stores" 
  ON public.orders FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.id = store_id AND s.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.id = store_id AND s.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Allow group_admin full control on orders" 
  ON public.orders FOR ALL 
  TO authenticated 
  USING (public.get_my_role() = 'group_admin') 
  WITH CHECK (public.get_my_role() = 'group_admin');


-- Order Items RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow customers to select their own order items" 
  ON public.order_items FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow managers to select order items of their stores" 
  ON public.order_items FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE o.id = order_id AND s.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Allow group_admin to select all order items" 
  ON public.order_items FOR SELECT 
  TO authenticated 
  USING (public.get_my_role() = 'group_admin');

CREATE POLICY "Allow customers to insert order items for their own orders" 
  ON public.order_items FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow customers to update order items for their own orders" 
  ON public.order_items FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow group_admin full control on order items" 
  ON public.order_items FOR ALL 
  TO authenticated 
  USING (public.get_my_role() = 'group_admin') 
  WITH CHECK (public.get_my_role() = 'group_admin');
