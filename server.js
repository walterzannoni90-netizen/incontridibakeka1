const express = require('express');
const path = require('path');
const app = express();
const PORT = 3030;

require('dotenv').config();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ============================================================
// DATABASE: Supabase (primario) → SQLite (fallback)
// ============================================================
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let db = null;          // SQLite instance
let supabase = null;    // Supabase client
let USE_SUPABASE = false;

// Prova Supabase prima
if (SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('your-project')) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SERVICE_KEY || SUPABASE_KEY, { auth: { persistSession: false } });
    USE_SUPABASE = true;
    console.log('  🗄️  Database: Supabase PostgreSQL');
  } catch (e) {
    console.log('  ⚠️  Supabase non disponibile');
  }
}

// Fallback SQLite
if (!USE_SUPABASE) {
  try {
    const Database = require('better-sqlite3');
    db = new Database('database.sqlite');
    db.pragma('journal_mode = WAL');
    console.log('  🗄️  Database: SQLite (fallback)');
  } catch (e) {
    console.log('  ❌ Nessun database disponibile!');
    process.exit(1);
  }
}

// ============================================================
// DATA ACCESS LAYER
// ============================================================

async function dbQuery(sql, params = []) {
  if (USE_SUPABASE && supabase) {
    // Per query raw SQL via Supabase, usiamo l'API REST
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query_text: sql });
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Supabase query error:', e.message);
      return null;
    }
  }
  if (db) {
    try {
      const stmt = db.prepare(sql);
      if (sql.trim().toUpperCase().startsWith('SELECT')) return stmt.all(...params);
      return stmt.run(...params);
    } catch (e) {
      console.error('SQLite error:', e.message);
      return null;
    }
  }
  return null;
}

// ============================================================
// SEED DATA (SQLite only - Supabase già popolato)
// ============================================================
if (!USE_SUPABASE && db) {
  const categoryCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
  if (categoryCount === 0) {
    console.log('  🌱 Primo avvio — popolamento dati iniziali...');

    const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (slug, name, icon, class, description, color, sort_order) VALUES (?,?,?,?,?,?,?)');
    const cats = [
      ['donna-cerca-uomo', 'Donna Cerca Uomo', 'fa-female', 'womenseekmen', 'Sfoglia annunci reali di donne in cerca di uomini.', '#ff2d55', 1],
      ['uomo-cerca-donna', 'Uomo Cerca Donna', 'fa-male', 'menseekwomen', 'Uomini in cerca di donne. Profili verificati.', '#007aff', 2],
      ['uomo-cerca-uomo', 'Uomo Cerca Uomo', 'fa-venus-mars', 'menseekmen', 'Incontri gay.', '#ff9500', 3],
      ['donna-cerca-donna', 'Donna Cerca Donna', 'fa-venus', 'womenseekwomen', 'Donne che amano altre donne.', '#ff3b30', 4],
      ['coppie', 'Coppie', 'fa-heart', 'couples', 'Coppie per esperienze.', '#af52de', 5],
      ['cerco-amici', 'Cerco Amici', 'fa-handshake', 'seekfriends', 'Amicizie vere.', '#34c759', 6],
      ['anima-gemella', 'Cerco Anima Gemella', 'fa-dove', 'seeksoulmate', "Trova l'altra metà.", '#ff6482', 7],
      ['trans', 'Trans', 'fa-transgender', 'trans', 'Incontri trans.', '#e84393', 8]
    ];
    for (const c of cats) insertCategory.run(...c);

    const insertCity = db.prepare('INSERT OR IGNORE INTO cities (name, slug, region) VALUES (?,?,?)');
    const citiesData = [
      ['Napoli','napoli','Campania'],['Roma','roma','Lazio'],['Milano','milano','Lombardia'],
      ['Torino','torino','Piemonte'],['Firenze','firenze','Toscana'],['Bologna','bologna','Emilia-Romagna'],
      ['Venezia','venezia','Veneto'],['Palermo','palermo','Sicilia'],['Genova','genova','Liguria'],
      ['Bari','bari','Puglia'],['Catania','catania','Sicilia'],['Verona','verona','Veneto'],
      ['Pisa','pisa','Toscana'],['Lecce','lecce','Puglia'],['Brescia','brescia','Lombardia'],
      ['Parma','parma','Emilia-Romagna'],['Modena','modena','Emilia-Romagna'],['Salerno','salerno','Campania'],
      ['Bergamo','bergamo','Lombardia'],['Cagliari','cagliari','Sardegna']
    ];
    for (const c of citiesData) insertCity.run(...c);

    const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, name, surname, email, password, city, gender, birth_date, is_verified, is_premium) VALUES (?,?,?,?,?,?,?,?,?,?)');
    insertUser.run('u1','Sofia','Rossi','sofia@example.com','Sofia123!','Napoli','donna','2000-05-15',1,1);
    insertUser.run('u2','Alessandro','Verdi','alex@example.com','Alex123!','Milano','uomo','1995-08-22',1,1);
    insertUser.run('u3','Martina','Bianchi','martina@example.com','Martina123!','Roma','donna','2001-12-03',1,0);

    const insertAd = db.prepare('INSERT OR IGNORE INTO ads (id,title,category,city,age,gender,looking_for,image,description,price,rating,review_count,is_premium,is_verified,has_video) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    const adsData = [
      ['a1','Sofia ❤️ 24 anni','donna-cerca-uomo','Napoli',24,'donna','uomo','https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop&crop=face','Ciao! Sono Sofia, ragazza solare. Cerco uomini interessanti. 💫','120€/h',4.9,47,1,1,1],
      ['a2','Ginevra 💎 27 anni','donna-cerca-uomo','Roma',27,'donna','uomo','https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&crop=face','Modella e viaggiatrice. Cerco uomini di classe. 🌹','200€/h',4.8,89,1,1,1],
      ['a3','Alessandro 🔥 29 anni','uomo-cerca-donna','Milano',29,'uomo','donna','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face','Manager milanese. Cerco donne affascinanti. 🥂','150€/h',4.7,34,1,1,0],
      ['a4','Elena 🌺 22 anni','donna-cerca-uomo','Bologna',22,'donna','uomo','https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face','Studentessa dolce e affettuosa. 💕','100€/h',4.6,23,0,1,0],
      ['a5','Marco & Chiara 💑','coppie','Torino',32,'coppia','coppia','https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=500&fit=crop&crop=face','Coppia aperta per esperienze. 🍷','250€/h',4.9,56,1,1,1],
      ['a6','Valentina 🦋 26 anni','donna-cerca-uomo','Firenze',26,'donna','uomo','https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face','Guida turistica di giorno, compagna speciale di sera. 🎭','180€/h',4.9,71,1,1,1],
      ['a7','Diego 💪 31 anni','uomo-cerca-uomo','Napoli',31,'uomo','uomo','https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face','Personal trainer napoletano. ⚡','130€/h',4.8,42,1,1,0],
      ['a8','Sofia & Anna 👩‍❤️‍👩','donna-cerca-donna','Palermo',25,'donna','donna','https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop&crop=face','Due amiche speciali. 🌊','150€/h',4.6,19,0,1,0],
      ['a9','Luna ✨ 28 anni','trans','Roma',28,'trans','uomo','https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop&crop=face','Trans più bella di Roma! 🌙','170€/h',4.9,63,1,1,1],
      ['a10','Cristiano 🏆 35 anni','uomo-cerca-donna','Verona',35,'uomo','donna','https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face','Imprenditore veronese. 🎁','220€/h',4.7,28,1,1,0],
      ['a11','Giada 🌊 23 anni','donna-cerca-uomo','Bari',23,'donna','uomo','https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop&crop=face','Pugliese doc. 🏖️','90€/h',4.5,15,0,0,0],
      ['a12','Nicolas 🇫🇷 26 anni','uomo-cerca-uomo','Milano',26,'uomo','uomo','https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&crop=face','Francese a Milano, modello. 🇫🇷','190€/h',4.9,51,1,1,1],
      ['a13','Martina 🎀 21 anni','donna-cerca-uomo','Catania',21,'donna','uomo','https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop&crop=face','Siciliana doc. 🍋','110€/h',4.4,11,0,1,0],
      ['a14','Romeo & Giulietta 💕','coppie','Verona',30,'coppia','single','https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=500&fit=crop&crop=face','Coppia per esperienze a tre. 🎭','200€/h',4.8,38,1,1,0],
      ['a15','Beatrice 🦢 29 anni','donna-cerca-uomo','Venezia',29,'donna','uomo','https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop&crop=face','Veneziana doc, elegante. 🚣','250€/h',5.0,93,1,1,1]
    ];
    for (const a of adsData) insertAd.run(...a);

    console.log('  ✅ Database popolato con dati iniziali');
  }
}

// ============================================================
// SUPABASE HELPERS
// ============================================================

async function supabaseFrom(table) {
  if (!supabase) return { data: null, error: new Error('Supabase non disponibile') };
  return supabase.from(table);
}

// ============================================================
// API ROUTES
// ============================================================

// --- Categories ---
app.get('/api/categories', async (req, res) => {
  if (USE_SUPABASE && supabase) {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order');
    if (error) return res.json([]);
    return res.json(data);
  }
  res.json(db.prepare('SELECT * FROM categories ORDER BY sort_order').all());
});

// --- Cities ---
app.get('/api/cities', async (req, res) => {
  if (USE_SUPABASE && supabase) {
    const { data, error } = await supabase.from('cities').select('name').order('name');
    if (error) return res.json([]);
    return res.json(data.map(r => r.name));
  }
  res.json(db.prepare('SELECT name FROM cities ORDER BY name').all().map(r => r.name));
});

// --- Stats ---
app.get('/api/stats', async (req, res) => {
  if (USE_SUPABASE && supabase) {
    const [{ count: totalAds }, { count: premiumAds }, { count: verifiedUsers }] = await Promise.all([
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('is_premium', true).eq('is_active', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true)
    ]);
    const { count: cityCount } = await supabase.from('cities').select('*', { count: 'exact', head: true });
    const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    return res.json({ totalAds: totalAds || 0, premiumAds: premiumAds || 0, verifiedUsers: verifiedUsers || 0, citiesAvailable: cityCount || 0, categoriesAvailable: catCount || 0 });
  }
  const s = db.prepare('SELECT (SELECT COUNT(*) FROM ads WHERE is_active=1) as ta, (SELECT COUNT(*) FROM ads WHERE is_premium=1 AND is_active=1) as pa, (SELECT COUNT(*) FROM users WHERE is_verified=1) as vu, (SELECT COUNT(*) FROM cities) as cc, (SELECT COUNT(*) FROM categories) as kc').get();
  res.json({ totalAds: s.ta, premiumAds: s.pa, verifiedUsers: s.vu, citiesAvailable: s.cc, categoriesAvailable: s.kc });
});

// --- Ads ---
app.get('/api/ads', async (req, res) => {
  const { category, city, search, gender, premium, verified } = req.query;
  
  if (USE_SUPABASE && supabase) {
    let query = supabase.from('ads').select('*').eq('is_active', true);
    if (category && category !== 'all') query = query.eq('category', category);
    if (city && city !== 'all') query = query.ilike('city', city);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    if (gender) query = query.eq('gender', gender);
    if (premium === 'true') query = query.eq('is_premium', true);
    if (verified === 'true') query = query.eq('is_verified', true);
    query = query.order('is_sponsored', { ascending: false }).order('is_premium', { ascending: false }).order('created_at', { ascending: false });
    const { data, error } = await query;
    return res.json(error ? [] : data);
  }
  
  let sql = 'SELECT * FROM ads WHERE is_active = 1';
  const params = [];
  if (category && category !== 'all') { sql += ' AND category = ?'; params.push(category); }
  if (city && city !== 'all') { sql += ' AND LOWER(city) = LOWER(?)'; params.push(city); }
  if (search) { sql += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (gender) { sql += ' AND gender = ?'; params.push(gender); }
  if (premium === 'true') { sql += ' AND is_premium = 1'; }
  if (verified === 'true') { sql += ' AND is_verified = 1'; }
  sql += ' ORDER BY is_sponsored DESC, is_premium DESC, created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// --- Featured Ads ---
app.get('/api/ads/featured', async (req, res) => {
  if (USE_SUPABASE && supabase) {
    const { data, error } = await supabase.from('ads').select('*').eq('is_premium', true).eq('is_active', true).order('is_sponsored', { ascending: false }).order('rating', { ascending: false }).limit(6);
    return res.json(error ? [] : data);
  }
  res.json(db.prepare('SELECT * FROM ads WHERE is_premium = 1 AND is_active = 1 ORDER BY is_sponsored DESC, rating DESC LIMIT 6').all());
});

// --- Auth: Register ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, surname, email, password, city, gender, birthDate, acceptTerms } = req.body;
    if (!name || !email || !password || !acceptTerms) return res.json({ success: false, error: 'Compila tutti i campi obbligatori' });
    if (password.length < 8) return res.json({ success: false, error: 'Password almeno 8 caratteri' });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return res.json({ success: false, error: 'Password deve contenere minuscole, MAIUSCOLE e numeri' });

    if (USE_SUPABASE && supabase) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { name, surname }
      });
      if (authError) {
        if (authError.message.includes('already registered')) return res.json({ success: false, error: 'Email già registrata' });
        return res.json({ success: false, error: authError.message });
      }
      const uid = authData.user.id;
      await supabase.from('profiles').insert({
        id: uid, name, surname: surname || '', city: city || '', gender: gender || '',
        birth_date: birthDate || null, is_verified: false, is_premium: false
      });
      return res.json({
        success: true,
        user: { id: uid, name, email, city: city || '', isVerified: false, isPremium: false },
        token: ''
      });
    }

    // SQLite fallback
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.json({ success: false, error: 'Email già registrata' });
    if (birthDate) {
      const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
      if (age < 18) return res.json({ success: false, error: 'Devi essere maggiorenne' });
    }
    const id = `u${Date.now()}`;
    db.prepare('INSERT INTO users (id, name, surname, email, password, city, gender, birth_date) VALUES (?,?,?,?,?,?,?,?)').run(id, name, surname || '', email, password, city || '', gender || '', birthDate || '');
    const token = `tok_${id}_${Date.now()}`;
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?,?)').run(token, id);
    res.json({ success: true, user: { id, name, email, city: city || '', isVerified: false, isPremium: false }, token });
  } catch (e) { res.json({ success: false, error: 'Errore registrazione' }); }
});

// --- Auth: Login ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    if (!email || !password) return res.json({ success: false, error: 'Inserisci email e password' });

    if (USE_SUPABASE && supabase) {
      // Verifica utente tramite Auth Admin
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) return res.json({ success: false, error: 'Errore autenticazione' });
      const user = users.find(u => u.email === email);
      if (!user) return res.json({ success: false, error: 'Email o password non validi' });

      // Verifica password via sign-in
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.json({ success: false, error: 'Email o password non validi' });

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      return res.json({
        success: true,
        user: { id: data.user.id, name: profile?.name || user.user_metadata?.name || '', surname: profile?.surname || '', email: data.user.email, city: profile?.city || '', gender: profile?.gender || '', isVerified: !!profile?.is_verified, isPremium: !!profile?.is_premium, createdAt: data.user.created_at },
        token: data.session?.access_token || ''
      });
    }

    // SQLite fallback
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    if (!user) return res.json({ success: false, error: 'Email o password non validi' });
    const token = `tok_${user.id}_${Date.now()}`;
    db.prepare('INSERT INTO sessions (token, user_id, remember) VALUES (?,?,?)').run(token, user.id, remember ? 1 : 0);
    res.json({
      success: true,
      user: { id: user.id, name: user.name, surname: user.surname, email: user.email, city: user.city, gender: user.gender, isVerified: !!user.is_verified, isPremium: !!user.is_premium, createdAt: user.created_at },
      token
    });
  } catch (e) { res.json({ success: false, error: 'Errore accesso' }); }
});

// --- Auth: Logout ---
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (db && token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.json({ success: true });
});

// --- Auth: Me ---
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.json({ success: false, error: 'Non autenticato' });

    if (USE_SUPABASE && supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return res.json({ success: false, error: 'Non autenticato' });
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return res.json({
        success: true,
        user: { id: user.id, name: profile?.name || user.user_metadata?.name || '', surname: profile?.surname || '', email: user.email, city: profile?.city || '', gender: profile?.gender || '', isVerified: !!profile?.is_verified, isPremium: !!profile?.is_premium, createdAt: user.created_at }
      });
    }

    // SQLite fallback
    const session = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token);
    if (!session) return res.json({ success: false, error: 'Sessione non valida' });
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
    if (!user) return res.json({ success: false, error: 'Utente non trovato' });
    res.json({
      success: true,
      user: { id: user.id, name: user.name, surname: user.surname, email: user.email, city: user.city, gender: user.gender, isVerified: !!user.is_verified, isPremium: !!user.is_premium, createdAt: user.created_at }
    });
  } catch (e) { res.json({ success: false, error: 'Errore' }); }
});

// ============================================================
// AVVIO SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`\n  ✦ IncontriDiBakeka — Annunci Premium ✦`);
  console.log(`  ──────────────────────────────────────`);
  console.log(`  🌐  http://localhost:${PORT}`);
  console.log(`  🗄️  Database: ${USE_SUPABASE ? 'Supabase PostgreSQL' : 'SQLite (fallback)'}`);
  console.log(`  💎  Premium Dating Experience\n`);
});
