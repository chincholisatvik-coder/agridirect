-- ================================================================
-- AgriDirect Karnataka Database Schema for Supabase
-- Run this in your Supabase SQL Editor: Dashboard > SQL Editor > New query
-- ================================================================

-- 1. Users table (Farmers, Buyers, Admins)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('FARMER', 'BUYER', 'ADMIN')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  username TEXT,
  password TEXT DEFAULT '123',
  preferred_language TEXT DEFAULT 'en',
  location_name TEXT NOT NULL,
  pincode TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  kyc_document_id TEXT,
  is_verified BOOLEAN DEFAULT false,
  upi_id TEXT,
  email TEXT,
  avatar_url TEXT,
  auth_provider TEXT DEFAULT 'LOCAL',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Products table (Farmgate listings)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  farmer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  farmer_name TEXT NOT NULL,
  farmer_phone TEXT NOT NULL,
  farmer_verified BOOLEAN DEFAULT false,
  category TEXT NOT NULL,
  title JSONB NOT NULL, -- { "en": "...", "hi": "...", "kn": "..." }
  description JSONB NOT NULL,
  photo_url TEXT NOT NULL,
  harvest_month_year TEXT NOT NULL,
  quality_grade TEXT NOT NULL,
  shelf_life_months INT NOT NULL CHECK (shelf_life_months >= 3),
  available_stock_kg INT NOT NULL,
  wholesale_benchmark_per_kg NUMERIC NOT NULL,
  market_retail_benchmark_per_kg NUMERIC NOT NULL,
  normal_price_per_kg NUMERIC NOT NULL,
  bulk_price_per_kg NUMERIC NOT NULL,
  bulk_min_quantity_kg INT NOT NULL,
  bulk_max_quantity_kg INT NOT NULL,
  pickup_location_name TEXT NOT NULL,
  pickup_pincode TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  home_delivery_available BOOLEAN DEFAULT true,
  delivery_base_fee NUMERIC DEFAULT 25,
  delivery_rate_per_km NUMERIC DEFAULT 2.5,
  delivery_rate_per_kg NUMERIC DEFAULT 0.5,
  max_delivery_radius_km NUMERIC DEFAULT 50,
  is_approved_by_admin BOOLEAN DEFAULT true,
  is_ai_verified BOOLEAN DEFAULT true,
  ai_verification_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Group Buy Pools table
CREATE TABLE IF NOT EXISTS group_buy_pools (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  host_buyer_id TEXT REFERENCES users(id),
  host_buyer_name TEXT NOT NULL,
  locality_name TEXT NOT NULL,
  locality_pincode TEXT NOT NULL,
  drop_off_address TEXT NOT NULL,
  target_quantity_kg INT NOT NULL,
  max_quantity_kg INT,
  current_quantity_kg INT DEFAULT 0,
  unit_bulk_price NUMERIC NOT NULL,
  fulfillment_type TEXT NOT NULL,
  estimated_delivery_fee_total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'LOCKED_CONFIRMED', 'EXPIRED_REFUNDED')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  participants JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Orders table (with 24h Escrow Protection)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  buyer_id TEXT REFERENCES users(id),
  buyer_name TEXT NOT NULL,
  farmer_id TEXT REFERENCES users(id),
  farmer_name TEXT NOT NULL,
  product_id TEXT REFERENCES products(id),
  product_title JSONB NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('NORMAL', 'GROUP_BULK')),
  pool_id TEXT REFERENCES group_buy_pools(id),
  quantity_kg INT NOT NULL,
  unit_price_applied NUMERIC NOT NULL,
  subtotal_amount NUMERIC NOT NULL,
  fulfillment_type TEXT NOT NULL,
  farmer_delivery_approval TEXT DEFAULT 'NOT_REQUIRED',
  buyer_address TEXT NOT NULL,
  distance_km NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'ESCROW_HELD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE,
  escrow_release_at TIMESTAMP WITH TIME ZONE,
  dispute_reason TEXT,
  dispute_photo_url TEXT
);

-- 5. Platform Grievance & Incident Reports table
CREATE TABLE IF NOT EXISTS platform_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT REFERENCES users(id),
  reporter_name TEXT NOT NULL,
  reporter_role TEXT NOT NULL CHECK (reporter_role IN ('FARMER', 'BUYER', 'ADMIN')),
  reporter_phone TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('ORDER', 'PRODUCT', 'USER', 'GENERAL')),
  target_id TEXT,
  target_name TEXT,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_photo_url TEXT,
  status TEXT DEFAULT 'OPEN_PENDING' CHECK (status IN ('OPEN_PENDING', 'UNDER_INVESTIGATION', 'RESOLVED', 'DISMISSED')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security (RLS) - Set public access for demo
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buy_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Users" ON users FOR SELECT USING (true);
CREATE POLICY "Public Insert Users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Users" ON users FOR UPDATE USING (true);

CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Insert Products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Products" ON products FOR UPDATE USING (true);

CREATE POLICY "Public Read Pools" ON group_buy_pools FOR SELECT USING (true);
CREATE POLICY "Public Insert Pools" ON group_buy_pools FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Pools" ON group_buy_pools FOR UPDATE USING (true);

CREATE POLICY "Public Read Orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public Insert Orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Orders" ON orders FOR UPDATE USING (true);

CREATE POLICY "Public Read Reports" ON platform_reports FOR SELECT USING (true);
CREATE POLICY "Public Insert Reports" ON platform_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Reports" ON platform_reports FOR UPDATE USING (true);


