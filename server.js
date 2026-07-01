const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3030;
const APP_URL = process.env.APP_URL || 'http://localhost:3030';
const JWT_SECRET = process.env.JWT_SECRET || 'bakeka-jwt-secret-2024';

app.use(cors({
  origin: APP_URL,
  credentials: true
}));

app.use(cookieParser());
app.all('/api/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  require('./api/stripe-webhook')(req, res);
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ============================================================
// LOCAL SQLITE AUTH (fallback quando Supabase Auth non è raggiungibile)
// ============================================================
const initSqlJs = require('sql.js');
const fs = require('fs');
let SQL, localDb;

async function initLocalDb() {
  SQL = await initSqlJs();
  const dbPath = path.join(__dirname, 'database', 'auth.db');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  
  if (fs.existsSync(dbPath)) {
    localDb = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    localDb = new SQL.Database();
  }
  
  localDb.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT DEFAULT '',
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    city TEXT DEFAULT '',
    gender TEXT DEFAULT '',
    birth_date TEXT,
    is_verified INTEGER DEFAULT 0,
    is_premium INTEGER DEFAULT 0,
    credits INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  
  localDb.run(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
  
  _saveLocalDb();
}

function _saveLocalDb() {
  if (localDb) {
    const dbPath = path.join(__dirname, 'database', 'auth.db');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbPath, Buffer.from(localDb.export()));
  }
}

// ============================================================
// SUPABASE — Dati pubblici
// ============================================================
const SUPABASE_URL = 'https://rdqsmfgpbuswzilgbjyr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcXNtZmdwYnVzd3ppbGdianlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzYyMTcsImV4cCI6MjA5ODQxMjIxN30.EthEz46lh_bnJzjpQi9GrXiQsinyb5g47V1p1bwlL_E';

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('  🗄️  Dati: Supabase PostgreSQL');

// ============================================================
// API ROUTES
// ============================================================

app.all('/api/create-checkout', (req, res) => {
  require('./api/create-checkout')(req, res);
});

app.get('/api/categories', async (req, res) => {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order');
  res.json(error ? [] : data);
});

app.get('/api/cities', async (req, res) => {
  const { data, error } = await supabase.from('cities').select('name').order('name');
  res.json(error ? [] : data.map(r => r.name));
});

app.get('/api/stats', async (req, res) => {
  const [{ count: totalAds }, { count: premiumAds }, { count: verifiedUsers }] = await Promise.all([
    supabase.from('ads').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('ads').select('*', { count: 'exact', head: true }).eq('is_premium', true).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true)
  ]);
  const { count: cityCount } = await supabase.from('cities').select('*', { count: 'exact', head: true });
  const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
  res.json({ totalAds: totalAds || 0, premiumAds: premiumAds || 0, verifiedUsers: verifiedUsers || 0, citiesAvailable: cityCount || 0, categoriesAvailable: catCount || 0 });
});

app.get('/api/ads', async (req, res) => {
  const { category, city, search, gender, premium, verified } = req.query;
  let query = supabase.from('ads').select('*').eq('is_active', true);
  if (category && category !== 'all') query = query.eq('category', category);
  if (city && city !== 'all') query = query.ilike('city', city);
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  if (gender) query = query.eq('gender', gender);
  if (premium === 'true') query = query.eq('is_premium', true);
  if (verified === 'true') query = query.eq('is_verified', true);
  query = query.order('is_sponsored', { ascending: false }).order('is_premium', { ascending: false }).order('created_at', { ascending: false });
  const { data, error } = await query;
  res.json(error ? [] : data);
});

app.get('/api/ads/featured', async (req, res) => {
  const { data, error } = await supabase.from('ads').select('*').eq('is_premium', true).eq('is_active', true).order('is_sponsored', { ascending: false }).order('rating', { ascending: false }).limit(6);
  res.json(error ? [] : data);
});

// ============================================================
// AUTH — Locale con SQLite
// ============================================================

function getUserById(id) {
  const stmt = localDb.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([id]);
  const user = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return user;
}

function getUserByEmail(email) {
  const stmt = localDb.prepare('SELECT * FROM users WHERE email = ?');
  stmt.bind([email]);
  const user = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return user;
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    surname: user.surname || '',
    email: user.email,
    city: user.city || '',
    gender: user.gender || '',
    isVerified: !!user.is_verified,
    isPremium: !!user.is_premium,
    credits: user.credits || 0,
    role: user.role || 'user',
    createdAt: user.created_at
  };
}

// --- Register ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, surname, email, password, city, gender, birthDate, acceptTerms } = req.body;
    if (!name || !email || !password || !acceptTerms) 
      return res.json({ success: false, error: 'Compila tutti i campi obbligatori' });
    if (password.length < 6) 
      return res.json({ success: false, error: 'Password almeno 6 caratteri' });

    // Check existing
    const existing = getUserByEmail(email);
    if (existing) return res.json({ success: false, error: 'Email già registrata' });

    const uid = require('uuid').v4();
    const hashedPwd = bcrypt.hashSync(password, 10);
    
    const stmt = localDb.prepare(`
      INSERT INTO users (id, name, surname, email, password, city, gender, birth_date, is_verified, is_premium, credits)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)
    `);
    stmt.bind([uid, name, surname || '', email, hashedPwd, city || '', gender || '', birthDate || null]);
    stmt.step();
    stmt.free();
    _saveLocalDb();

    // Generate JWT
    const token = jwt.sign({ id: uid, email, role: 'user' }, JWT_SECRET, { expiresIn: '30d' });
    
    // Save session
    const sessionStmt = localDb.prepare('INSERT INTO sessions (id, user_id, token) VALUES (?, ?, ?)');
    sessionStmt.bind([require('uuid').v4(), uid, token]);
    sessionStmt.step();
    sessionStmt.free();
    _saveLocalDb();

    console.log('[REGISTER] User created:', email);
    
    return res.json({
      success: true,
      user: { id: uid, name, email, city: city || '', isVerified: false, isPremium: false, credits: 0 },
      token
    });
  } catch (e) {
    console.error('[REGISTER] Exception:', e.message);
    res.json({ success: false, error: 'Errore registrazione: ' + e.message });
  }
});

// --- Login ---
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ success: false, error: 'Inserisci email e password' });

    const user = getUserByEmail(email);
    if (!user) return res.json({ success: false, error: 'Email non registrata' });
    
    if (!bcrypt.compareSync(password, user.password)) {
      return res.json({ success: false, error: 'Password non valida' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '30d' });
    
    // Save session
    const uuid = require('uuid').v4;
    const sessionStmt = localDb.prepare('DELETE FROM sessions WHERE user_id = ?');
    sessionStmt.bind([user.id]);
    sessionStmt.step();
    sessionStmt.free();
    
    const insertStmt = localDb.prepare('INSERT INTO sessions (id, user_id, token) VALUES (?, ?, ?)');
    insertStmt.bind([require('uuid').v4(), user.id, token]);
    insertStmt.step();
    insertStmt.free();
    _saveLocalDb();

    console.log('[LOGIN] Success:', email);
    
    return res.json({
      success: true,
      user: sanitizeUser(user),
      token
    });
  } catch (e) {
    console.error('[LOGIN] Exception:', e.message);
    res.json({ success: false, error: 'Errore accesso' });
  }
});

// --- Logout ---
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const stmt = localDb.prepare('DELETE FROM sessions WHERE token = ?');
    stmt.bind([token]);
    stmt.step();
    stmt.free();
    _saveLocalDb();
  }
  res.json({ success: true });
});

// --- Me ---
app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.json({ success: false, error: 'Non autenticato' });
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.json({ success: false, error: 'Sessione scaduta' });
    }
    
    const user = getUserById(decoded.id);
    if (!user) return res.json({ success: false, error: 'Utente non trovato' });
    
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (e) {
    res.json({ success: false, error: 'Errore' });
  }
});

// ============================================================
// AVVIO
// ============================================================
async function start() {
  await initLocalDb();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ✦ IncontriDiBakeka — Annunci Premium ✦`);
    console.log(`  ──────────────────────────────────────`);
    console.log(`  🌐  ${APP_URL}`);
    console.log(`  🗄️  Dati: Supabase PostgreSQL`);
    console.log(`  🔐  Auth: SQLite Locale`);
    console.log(`  💎  Premium Dating Experience\n`);
  });
}

start();
