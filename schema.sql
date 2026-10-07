-- ====================================================================
-- DESIGNHUB GLOBAL (wearstay.com) - SUPABASE PRODUCTION DATABASE SCHEMA
-- ====================================================================
-- Instructions: Run this script directly in the Supabase SQL Editor.
-- It configures Row Level Security (RLS), tables, triggers, and indices.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by owner"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Export Usage Table (Enforcing Exactly 2 Free Exports Per User)
CREATE TABLE IF NOT EXISTS public.export_usage (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  exports_count INTEGER DEFAULT 0 NOT NULL,
  last_exported_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.export_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own export usage"
  ON public.export_usage FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Export Logs Table (Audit trail of every download)
CREATE TABLE IF NOT EXISTS public.export_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  format TEXT NOT NULL,
  is_pro BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own export logs"
  ON public.export_logs FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Subscriptions Table (Pro Plan: $4.99/month)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE UNIQUE NOT NULL,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'canceled', 'past_due')),
  plan TEXT DEFAULT 'pro_monthly',
  amount NUMERIC(10, 2) DEFAULT 4.99,
  currency TEXT DEFAULT 'USD',
  paypal_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 6. Cloud Projects Table (User Design Files)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Design',
  canvas_data JSONB NOT NULL,
  dimensions TEXT NOT NULL DEFAULT '1280x720',
  unit TEXT NOT NULL DEFAULT 'px',
  preview_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id);

-- 7. Signage Orders Table (Physical Manufacturing Inquiries)
CREATE TABLE IF NOT EXISTS public.signage_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  width NUMERIC(10, 2) NOT NULL,
  height NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'inch',
  color TEXT,
  material TEXT,
  quantity INTEGER DEFAULT 1,
  fulfillment_option TEXT DEFAULT 'Delivery',
  advance_payment_ref TEXT,
  file_name TEXT,
  file_data_url TEXT,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'in_production', 'dispatched', 'delivered', 'canceled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.signage_orders ENABLE ROW LEVEL SECURITY;

-- Customers can view their own signage orders
CREATE POLICY "Users can view own signage orders"
  ON public.signage_orders FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view and manage all signage orders
CREATE POLICY "Admins can view all signage orders"
  ON public.signage_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 8. Payment Records Table (Webhook & Transaction Auditing)
CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'received',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for payment records"
  ON public.payment_records FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 9. Dynamic Pricing Rules & Materials Configuration Table
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL, -- 'product', 'material', 'warranty', 'delivery', 'tax'
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rate NUMERIC(10, 2) NOT NULL,
  unit TEXT DEFAULT 'sqft',
  multiplier NUMERIC(5, 3) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pricing rules"
  ON public.pricing_rules FOR SELECT
  USING (true);

CREATE POLICY "Admins can update pricing rules"
  ON public.pricing_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ====================================================================
-- TRIGGERS & AUTOMATION
-- ====================================================================

-- Function to handle new user registration: auto-creates profile & export_usage
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    CASE WHEN new.email = 'ledsignadil@gmail.com' THEN 'admin' ELSE 'user' END
  );

  -- Initialize export usage with 0 exports used
  INSERT INTO public.export_usage (user_id, exports_count)
  VALUES (new.id, 0);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_signage_orders_order_id ON public.signage_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_signage_orders_user_id ON public.signage_orders(user_id);
