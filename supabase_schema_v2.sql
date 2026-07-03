-- ============================================
-- Incontri di Bakeka - Schema v2 (migrazione)
-- Aggiunge i campi dettaglio annuncio, has_paid e vetrina/boost.
-- Esegui questo script nel SQL Editor di Supabase.
-- ============================================

-- ============================================
-- 1. PROFILES: has_paid
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. ADS: campi dettaglio + vetrina
-- ============================================
ALTER TABLE ads ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'IT';
ALTER TABLE ads ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS hair_color TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS body_type TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS services TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS availability_hours TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS weight INTEGER;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS vetrina_scheduled_at TIMESTAMPTZ;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS vetrina_duration_days INTEGER;

-- ============================================
-- 3. INDICI per vetrina/boost attivi
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ads_boosted_until ON ads(boosted_until);
CREATE INDEX IF NOT EXISTS idx_ads_vetrina_scheduled ON ads(vetrina_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_ads_created_user ON ads(created_at DESC, user_id);

-- ============================================
-- 4. RLS: i nuovi campi sono coperti dalle policy esistenti
--    (ads_select_all / ads_insert_own / ads_update_own).
--    Nessuna policy aggiuntiva necessaria.
-- ============================================
