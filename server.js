const express = require('express');
const path = require('path');
const app = express();
const PORT = 3030;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ============================================================
// SQLITE DATABASE — Persistente, zero config
// ============================================================
const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

// Attiva WAL mode per performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================================
// CREAZIONE TABELLE (auto-migrate)
// ============================================================
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '',
    class TEXT DEFAULT '',
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#8b5cf6',
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS cities (
    name TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    region TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT DEFAULT '',
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT DEFAULT '',
    city TEXT DEFAULT '',
    gender TEXT DEFAULT '',
    birth_date TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    is_verified INTEGER DEFAULT 0,
    is_premium INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ads (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT '',
    city TEXT DEFAULT '',
    age INTEGER DEFAULT 0,
    gender TEXT DEFAULT '',
    looking_for TEXT DEFAULT '',
    image TEXT DEFAULT '',
    description TEXT DEFAULT '',
    price TEXT DEFAULT '',
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    is_premium INTEGER DEFAULT 0,
    is_verified INTEGER DEFAULT 0,
    has_video INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    is_sponsored INTEGER DEFAULT 0,
    sponsor_plan TEXT DEFAULT '',
    sponsor_expires_at TEXT DEFAULT '',
    views INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    remember INTEGER DEFAULT 0
  );
`);

// ============================================================
// SEED DATA (se il database è vuoto)
// ============================================================
const categoryCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
if (categoryCount === 0) {
  console.log('  🌱 Primo avvio — popolamento dati iniziali...');

  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (slug, name, icon, class, description, color, sort_order) VALUES (?,?,?,?,?,?,?)');
  const cats = [
    ['donna-cerca-uomo', 'Donna Cerca Uomo', 'fa-female', 'womenseekmen', 'Sfoglia annunci reali di donne in cerca di uomini. Escort, ragazze squillo e accompagnatrici nella tua città.', '#ff2d55', 1],
    ['uomo-cerca-donna', 'Uomo Cerca Donna', 'fa-male', 'menseekwomen', 'Uomini in cerca di donne. Profili verificati per incontri indimenticabili.', '#007aff', 2],
    ['uomo-cerca-uomo', 'Uomo Cerca Uomo', 'fa-venus-mars', 'menseekmen', 'Incontri gay. Annunci di escort maschi, accompagnatori e molto altro.', '#ff9500', 3],
    ['donna-cerca-donna', 'Donna Cerca Donna', 'fa-venus', 'womenseekwomen', 'Donne che amano altre donne. Lesbo, amori e passioni al femminile.', '#ff3b30', 4],
    ['coppie', 'Coppie', 'fa-heart', 'couples', 'Coppie in cerca di coppie e single per esperienze swinger e scambismo.', '#af52de', 5],
    ['cerco-amici', 'Cerco Amici', 'fa-handshake', 'seekfriends', 'Amicizie vere e uscite nella tua città. Persone speciali per momenti indimenticabili.', '#34c759', 6],
    ['anima-gemella', 'Cerco Anima Gemella', 'fa-dove', 'seeksoulmate', "L'amore vero esiste. Trova l'altra metà della tua mela.", '#ff6482', 7],
    ['trans', 'Trans', 'fa-transgender', 'trans', 'Incontri trans e travestiti. Annunci di transgender in cerca di avventure.', '#e84393', 8]
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

  const insertAd = db.prepare(`INSERT OR IGNORE INTO ads (id,title,category,city,age,gender,looking_for,image,description,price,rating,review_count,is_premium,is_verified,has_video) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const adsData = [
    ['a1','Sofia ❤️ 24 anni','donna-cerca-uomo','Napoli',24,'donna','uomo','https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop&crop=face','Ciao bellissimo! Sono Sofia, una ragazza solare e appassionata. Cerco un uomo maturo e interessante per serate indimenticabili 💫','120€/h',4.9,47,1,1,1],
    ['a2','Ginevra 💎 27 anni','donna-cerca-uomo','Roma',27,'donna','uomo','https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&crop=face','Sono Ginevra, modella e viaggiatrice. Cerco uomini di classe per esperienze esclusive. Massaggi, cene e passione nella capitale eterna 🌹','200€/h',4.8,89,1,1,1],
    ['a3','Alessandro 🔥 29 anni','uomo-cerca-donna','Milano',29,'uomo','donna','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face','Manager milanese, alto e sportivo. Cerco donne affascinanti per aperitivi e serate eleganti in centro a Milano. 🥂','150€/h',4.7,34,1,1,0],
    ['a4','Elena 🌺 22 anni','donna-cerca-uomo','Bologna',22,'donna','uomo','https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face','Studentessa universitaria, dolce e affettuosa. Cerco uomini generosi per compagnia e momenti speciali. 💕','100€/h',4.6,23,0,1,0],
    ['a5','Marco & Chiara 💑','coppie','Torino',32,'coppia','coppia','https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=500&fit=crop&crop=face','Coppia aperta, educata e professionale. Cerchiamo coppie o single per serate piacevoli. 🍷','250€/h',4.9,56,1,1,1],
    ['a6','Valentina 🦋 26 anni','donna-cerca-uomo','Firenze',26,'donna','uomo','https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face','Firenze... che romantica! Sono Valentina, guida turistica di giorno, compagna speciale di sera. 🎭','180€/h',4.9,71,1,1,1],
    ['a7','Diego 💪 31 anni','uomo-cerca-uomo','Napoli',31,'uomo','uomo','https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face','Personal trainer napoletano, fisico atletico e sorriso mozzafiato. ⚡','130€/h',4.8,42,1,1,0],
    ['a8','Sofia & Anna 👩‍❤️‍👩','donna-cerca-donna','Palermo',25,'donna','donna','https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop&crop=face','Due amiche speciali in cerca di una terza per completare la serata. 🌊','150€/h',4.6,19,0,1,0],
    ['a9','Luna ✨ 28 anni','trans','Roma',28,'trans','uomo','https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop&crop=face','Trans più bella di Roma! Sono Luna, elegante e sensuale. 🌙','170€/h',4.9,63,1,1,1],
    ['a10','Cristiano 🏆 35 anni','uomo-cerca-donna','Verona',35,'uomo','donna','https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face','Imprenditore veronese, passionale e generoso. Cerco donne raffinate. 🎁','220€/h',4.7,28,1,1,0],
    ['a11','Giada 🌊 23 anni','donna-cerca-uomo','Bari',23,'donna','uomo','https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop&crop=face','Pugliese doc, solare e generosa. Amo il mare, la buona cucina. 🏖️','90€/h',4.5,15,0,0,0],
    ['a12','Nicolas 🇫🇷 26 anni','uomo-cerca-uomo','Milano',26,'uomo','uomo','https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&crop=face','Francese a Milano, modello e creator. Cerco ragazzi affascinanti. 🇫🇷✨','190€/h',4.9,51,1,1,1],
    ['a13','Martina 🎀 21 anni','donna-cerca-uomo','Catania',21,'donna','uomo','https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop&crop=face','Siciliana doc, dolce e appassionata. Cerco uomini maturi e generosi. 🍋','110€/h',4.4,11,0,1,0],
    ['a14','Romeo & Giulietta 💕','coppie','Verona',30,'coppia','single','https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=500&fit=crop&crop=face','Coppia giovane e spumeggiante cerca single per esperienze a tre. 🎭','200€/h',4.8,38,1,1,0],
    ['a15','Beatrice 🦢 29 anni','donna-cerca-uomo','Venezia',29,'donna','uomo','https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop&crop=face','Veneziana doc, elegante e raffinata. Amo l\'arte e i giri in gondola. 🚣','250€/h',5.0,93,1,1,1]
  ];
  for (const a of adsData) insertAd.run(...a);

  console.log('  ✅ Database popolato con categorie, città, utenti e annunci');
}

// ============================================================
// API ROUTES
// ============================================================

// --- Categories ---
app.get('/api/categories', (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY sort_order').all());
});

// --- Cities ---
app.get('/api/cities', (req, res) => {
  res.json(db.prepare('SELECT name FROM cities ORDER BY name').all().map(r => r.name));
});

// --- Stats ---
app.get('/api/stats', (req, res) => {
  const totalAds = db.prepare('SELECT COUNT(*) as c FROM ads WHERE is_active = 1').get().c;
  const premiumAds = db.prepare('SELECT COUNT(*) as c FROM ads WHERE is_premium = 1 AND is_active = 1').get().c;
  const verifiedUsers = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_verified = 1').get().c;
  const cityCount = db.prepare('SELECT COUNT(*) as c FROM cities').get().c;
  const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
  res.json({ totalAds, premiumAds, verifiedUsers, citiesAvailable: cityCount, categoriesAvailable: catCount });
});

// --- Ads ---
app.get('/api/ads', (req, res) => {
  const { category, city, search, gender, minAge, maxAge, premium, verified } = req.query;
  let sql = 'SELECT * FROM ads WHERE is_active = 1';
  const params = [];

  if (category && category !== 'all') { sql += ' AND category = ?'; params.push(category); }
  if (city && city !== 'all') { sql += ' AND LOWER(city) = LOWER(?)'; params.push(city); }
  if (search) { sql += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (gender) { sql += ' AND gender = ?'; params.push(gender); }
  if (minAge) { sql += ' AND age >= ?'; params.push(parseInt(minAge)); }
  if (maxAge) { sql += ' AND age <= ?'; params.push(parseInt(maxAge)); }
  if (premium === 'true') { sql += ' AND is_premium = 1'; }
  if (verified === 'true') { sql += ' AND is_verified = 1'; }

  sql += ' ORDER BY is_sponsored DESC, is_premium DESC, created_at DESC';

  res.json(db.prepare(sql).all(...params));
});

// --- Featured Ads ---
app.get('/api/ads/featured', (req, res) => {
  res.json(db.prepare('SELECT * FROM ads WHERE is_premium = 1 AND is_active = 1 ORDER BY is_sponsored DESC, rating DESC LIMIT 6').all());
});

// --- Auth: Register ---
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, surname, email, password, city, gender, birthDate, acceptTerms } = req.body;

    if (!name || !email || !password || !acceptTerms)
      return res.json({ success: false, error: 'Compila tutti i campi obbligatori' });
    if (password.length < 8)
      return res.json({ success: false, error: 'La password deve essere almeno 8 caratteri' });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      return res.json({ success: false, error: 'La password deve contenere minuscole, MAIUSCOLE e numeri' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.json({ success: false, error: 'Email già registrata' });

    if (birthDate) {
      const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
      if (age < 18) return res.json({ success: false, error: 'Devi essere maggiorenne per registrarti' });
    }

    const id = `u${Date.now()}`;
    db.prepare('INSERT INTO users (id, name, surname, email, password, city, gender, birth_date) VALUES (?,?,?,?,?,?,?,?)')
      .run(id, name, surname || '', email, password, city || '', gender || '', birthDate || '');

    const token = `tok_${id}_${Date.now()}`;
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?,?)').run(token, id);

    res.json({
      success: true,
      user: { id, name, email, city: city || '', isVerified: false, isPremium: false },
      token
    });
  } catch (e) {
    res.json({ success: false, error: 'Errore durante la registrazione' });
  }
});

// --- Auth: Login ---
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password, remember } = req.body;
    if (!email || !password) return res.json({ success: false, error: 'Inserisci email e password' });

    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    if (!user) return res.json({ success: false, error: 'Email o password non validi' });

    const token = `tok_${user.id}_${Date.now()}`;
    db.prepare('INSERT INTO sessions (token, user_id, remember) VALUES (?,?,?)').run(token, user.id, remember ? 1 : 0);

    res.json({
      success: true,
      user: { id: user.id, name: user.name, surname: user.surname, email: user.email, city: user.city, gender: user.gender, isVerified: !!user.is_verified, isPremium: !!user.is_premium, createdAt: user.created_at },
      token
    });
  } catch (e) {
    res.json({ success: false, error: 'Errore durante l\'accesso' });
  }
});

// --- Auth: Logout ---
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.json({ success: true });
});

// --- Auth: Me ---
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.json({ success: false, error: 'Non autenticato' });

  const session = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token);
  if (!session) return res.json({ success: false, error: 'Sessione non valida' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  if (!user) return res.json({ success: false, error: 'Utente non trovato' });

  res.json({
    success: true,
    user: { id: user.id, name: user.name, surname: user.surname, email: user.email, city: user.city, gender: user.gender, isVerified: !!user.is_verified, isPremium: !!user.is_premium, createdAt: user.created_at }
  });
});

// ============================================================
// AVVIO SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`\n  ✦ IncontriDiBakeka — Annunci Premium ✦`);
  console.log(`  ──────────────────────────────────────`);
  console.log(`  🌐  http://localhost:${PORT}`);
  console.log(`  🗄️  SQLite (persistente, zero-config)`);
  console.log(`  💎  Premium Dating Experience\n`);
});
