-- ============================================
-- Incontri di Bakeka - Schema v2 (migrazione)
-- Aggiunge i campi dettaglio annuncio, has_paid, vetrina/boost e la funzione increment_credits.
-- Esegui questo script nel SQL Editor di Supabase DOPO supabase_schema.sql.
-- ============================================

-- ============================================
-- 1. PROFILES: has_paid (idempotente)
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

-- Campi vetrina usati dal codice client (Home.tsx, AdDetail.tsx)
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

-- ============================================
-- 5. FUNZIONE: increment_credits()
-- Incrementa atomicamente i crediti di un utente e imposta has_paid = true.
-- Usata dal webhook Stripe per accreditare i crediti dopo un pagamento.
-- ============================================
CREATE OR REPLACE FUNCTION increment_credits(p_user_id UUID, p_credits INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    credits = credits + p_credits,
    has_paid = true,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
