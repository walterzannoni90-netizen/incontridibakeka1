-- ============================================================
-- SEED DATA — Popola il database con dati iniziali
-- Esegui DOPO aver creato le tabelle con supabase-schema.sql
-- ============================================================

-- 1. CATEGORIES
INSERT INTO categories (slug, name, icon, class, description, color, sort_order) VALUES
  ('donna-cerca-uomo', 'Donna Cerca Uomo', 'fa-female', 'womenseekmen', 'Sfoglia annunci reali di donne in cerca di uomini. Escort, ragazze squillo e accompagnatrici nella tua città.', '#ff2d55', 1),
  ('uomo-cerca-donna', 'Uomo Cerca Donna', 'fa-male', 'menseekwomen', 'Uomini in cerca di donne. Profili verificati per incontri indimenticabili.', '#007aff', 2),
  ('uomo-cerca-uomo', 'Uomo Cerca Uomo', 'fa-venus-mars', 'menseekmen', 'Incontri gay. Annunci di escort maschi, accompagnatori e molto altro.', '#ff9500', 3),
  ('donna-cerca-donna', 'Donna Cerca Donna', 'fa-venus', 'womenseekwomen', 'Donne che amano altre donne. Lesbo, amori e passioni al femminile.', '#ff3b30', 4),
  ('coppie', 'Coppie', 'fa-heart', 'couples', 'Coppie in cerca di coppie e single per esperienze swinger e scambismo.', '#af52de', 5),
  ('cerco-amici', 'Cerco Amici', 'fa-handshake', 'seekfriends', 'Amicizie vere e uscite nella tua città. Persone speciali per momenti indimenticabili.', '#34c759', 6),
  ('anima-gemella', 'Cerco Anima Gemella', 'fa-dove', 'seeksoulmate', 'L''amore vero esiste. Trova l''altra metà della tua mela.', '#ff6482', 7),
  ('trans', 'Trans', 'fa-transgender', 'trans', 'Incontri trans e travestiti. Annunci di transgender in cerca di avventure.', '#e84393', 8)
ON CONFLICT (slug) DO NOTHING;

-- 2. CITIES
INSERT INTO cities (name, slug, region) VALUES
  ('Napoli', 'napoli', 'Campania'),
  ('Roma', 'roma', 'Lazio'),
  ('Milano', 'milano', 'Lombardia'),
  ('Torino', 'torino', 'Piemonte'),
  ('Firenze', 'firenze', 'Toscana'),
  ('Bologna', 'bologna', 'Emilia-Romagna'),
  ('Venezia', 'venezia', 'Veneto'),
  ('Palermo', 'palermo', 'Sicilia'),
  ('Genova', 'genova', 'Liguria'),
  ('Bari', 'bari', 'Puglia'),
  ('Catania', 'catania', 'Sicilia'),
  ('Verona', 'verona', 'Veneto'),
  ('Pisa', 'pisa', 'Toscana'),
  ('Lecce', 'lecce', 'Puglia'),
  ('Brescia', 'brescia', 'Lombardia'),
  ('Parma', 'parma', 'Emilia-Romagna'),
  ('Modena', 'modena', 'Emilia-Romagna'),
  ('Salerno', 'salerno', 'Campania'),
  ('Bergamo', 'bergamo', 'Lombardia'),
  ('Cagliari', 'cagliari', 'Sardegna')
ON CONFLICT (name) DO NOTHING;

-- 3. ANNUNCI ESEMPIO (richiede un utente admin)
-- Prima crea un utente di test su Supabase Auth, poi usa il suo UUID qui sotto
-- Sostituisci 'USER_UUID_HERE' con l'ID dell'utente dopo averlo creato
-- Oppure usa il pannello Supabase per inserire gli annunci manualmente
