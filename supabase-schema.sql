-- ============================================================
-- INCONTRI DI BAKEKA — Supabase Schema
-- Esegui questo SQL nel SQL Editor di Supabase
-- ============================================================

-- 1. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '',
  class TEXT DEFAULT '',
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#8b5cf6',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CITIES
CREATE TABLE IF NOT EXISTS cities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  region TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES (utenti)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  surname TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  city TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  birth_date DATE,
  avatar_url TEXT DEFAULT '',
  is_verified BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ADS (annunci)
CREATE TABLE IF NOT EXISTS ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT,
  category_slug TEXT REFERENCES categories(slug) ON DELETE SET NULL,
  city TEXT NOT NULL,
  age INT DEFAULT 0,
  gender TEXT DEFAULT '',
  looking_for TEXT DEFAULT '',
  image TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  price TEXT DEFAULT '',
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  has_video BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_sponsored BOOLEAN DEFAULT false,
  sponsor_plan TEXT DEFAULT '',
  sponsor_expires_at TIMESTAMPTZ,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SPONSORSHIPS (storico sponsorizzazioni)
CREATE TABLE IF NOT EXISTS sponsorships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL, -- '1day','3days','7days','30days'
  amount DECIMAL(10,2) NOT NULL,
  duration_days INT NOT NULL,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_method TEXT DEFAULT '',
  payment_status TEXT DEFAULT 'completed', -- pending, completed, refunded
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_ads_category ON ads(category_slug);
CREATE INDEX IF NOT EXISTS idx_ads_city ON ads(city);
CREATE INDEX IF NOT EXISTS idx_ads_premium ON ads(is_premium);
CREATE INDEX IF NOT EXISTS idx_ads_sponsored ON ads(is_sponsored);
CREATE INDEX IF NOT EXISTS idx_ads_user ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active);
CREATE INDEX IF NOT EXISTS idx_sponsorships_expires ON sponsorships(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(id);

-- 7. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies
-- Profiles: users can read all profiles, update only own
CREATE POLICY "Profili pubblici in lettura" ON profiles FOR SELECT USING (true);
CREATE POLICY "Proprio profilo in modifica" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Proprio profilo in inserimento" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Ads: anyone can read active ads, only owner can modify
CREATE POLICY "Annunci pubblici in lettura" ON ads FOR SELECT USING (is_active = true OR auth.uid() = user_id);
CREATE POLICY "Propri annunci in modifica" ON ads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Propri annunci in inserimento" ON ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Propri annunci in eliminazione" ON ads FOR DELETE USING (auth.uid() = user_id);

-- Sponsorships: users can read own, admins can read all
CREATE POLICY "Proprie sponsorizzazioni" ON sponsorships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Inserimento sponsorizzazioni" ON sponsorships FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. Funzione auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ads_updated_at BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
