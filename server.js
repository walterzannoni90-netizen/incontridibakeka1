/**
 * BAKECA INCONTRI CLONE - Server
 * Versione pulita e funzionante
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3030;
const APP_URL = process.env.APP_URL || 'http://localhost:3030';
const JWT_SECRET = process.env.JWT_SECRET || 'bakeka-jwt-secret-2024';

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ============================================================
// LOCAL SQLite DB for Auth
// ============================================================
const initSqlJs = require('sql.js');
let localDb;

async function initLocalDb() {
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, 'database', 'users.db');
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
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT DEFAULT '',
    city TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  
  saveLocalDb();
}

function saveLocalDb() {
  if (localDb) {
    const dbPath = path.join(__dirname, 'database', 'users.db');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbPath, Buffer.from(localDb.export()));
  }
}

function getUserByEmail(email) {
  const stmt = localDb.prepare('SELECT * FROM users WHERE email = ?');
  stmt.bind([email]);
  const user = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return user;
}

function getUserById(id) {
  const stmt = localDb.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([id]);
  const user = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return user;
}

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Inject env vars in HTML - DEVE essere prima di express.static
app.get('/', (req, res) => {
  let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  
  const envScript = `<script>
    window.ENV = {
      SUPABASE_URL: '${process.env.SUPABASE_URL}',
      SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY}',
      STRIPE_PUBLISHABLE_KEY: '${process.env.STRIPE_PUBLISHABLE_KEY || ''}'
    };
  </script>`;
  
  html = html.replace('<script id="env-config"></script>', envScript);
  res.send(html);
});

app.use(express.static(path.join(__dirname)));

// Stripe Webhook
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const credits = parseInt(session.metadata.credits);
      
      // Aggiungi crediti
      const { data: profile } = await supabase.from('profiles').select('credits').eq('id', userId).single();
      const newCredits = (profile?.credits || 0) + credits;
      await supabase.from('profiles').update({ credits: newCredits }).eq('id', userId);
      
      // Registra transazione
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: credits,
        type: 'purchase',
        description: `Acquisto ${credits} crediti via Stripe`
      });
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// ============================================================
// API: PUBBLICHE
// ============================================================

// Stats
app.get('/api/stats', async (req, res) => {
  try {
    const { count: totalAds } = await supabase.from('ads').select('*', { count: 'exact', head: true }).eq('is_active', true);
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: cities } = await supabase.from('cities').select('*', { count: 'exact', head: true });
    
    res.json({ totalAds: totalAds || 0, totalUsers: totalUsers || 0, cities: cities || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Categorie
app.get('/api/categories', async (req, res) => {
  try {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Città
app.get('/api/cities', async (req, res) => {
  try {
    const { data } = await supabase.from('cities').select('name, slug').order('name');
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Annunci con filtri
app.get('/api/ads', async (req, res) => {
  try {
    const { category, city, search, limit = 50 } = req.query;
    let query = supabase.from('ads').select('*').eq('is_active', true);
    
    if (category && category !== 'all') query = query.eq('category', category);
    if (city && city !== 'all') query = query.ilike('city', city);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    
    query = query.order('created_at', { ascending: false }).limit(parseInt(limit));
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Annuncio singolo
app.get('/api/ads/:id', async (req, res) => {
  try {
    const { data } = await supabase.from('ads').select('*').eq('id', req.params.id).single();
    
    if (!data) return res.status(404).json({ error: 'Annuncio non trovato' });
    
    // Incrementa views
    await supabase.from('ads').update({ views: (data.views || 0) + 1 }).eq('id', req.params.id);
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Annunci per città/categoria (URL style)
app.get('/api/ads-by/:city/:category', async (req, res) => {
  try {
    const { city, category } = req.params;
    let query = supabase.from('ads').select('*').eq('is_active', true);
    
    if (city !== 'all') query = query.ilike('city', city);
    if (category !== 'all') query = query.eq('category', category);
    
    query = query.order('created_at', { ascending: false }).limit(50);
    const { data } = await query;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// API: AUTH (using local SQLite)
// ============================================================

// Registrazione
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, city, acceptTerms } = req.body;
    
    if (!name || !email || !password || !acceptTerms) {
      return res.status(400).json({ success: false, error: 'Compila tutti i campi obbligatori' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password minimo 6 caratteri' });
    }
    
    // Check se email esiste nel DB locale
    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email già registrata' });
    }
    
    const userId = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Salva in SQLite locale
    localDb.run(
      'INSERT INTO users (id, name, email, password, phone, city) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, phone || '', city || '']
    );
    saveLocalDb();
    
    // Genera token
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({
      success: true,
      user: { id: userId, name, email, city: city || '', isPremium: false, credits: 0 },
      token
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Errore registrazione' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Inserisci email e password' });
    }
    
    const user = getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Email non registrata' });
    }
    
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, error: 'Password non valida' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city || '',
        phone: user.phone || ''
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Errore login' });
  }
});

// Chi è loggato
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, error: 'Non autenticato' });
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = getUserById(decoded.id);
    
    if (!user) return res.status(404).json({ success: false, error: 'Utente non trovato' });
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city || '',
        phone: user.phone || ''
      }
    });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Sessione scaduta' });
  }
});

// ============================================================
// API: UTENTI LOGGATI
// ============================================================

// Middleware auth
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Non autenticato' });
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token non valido' });
  }
};

// I miei annunci
app.get('/api/my-ads', requireAuth, async (req, res) => {
  try {
    const { data } = await supabase.from('ads').select('*').eq('user_id', req.userId).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crea annuncio
app.post('/api/ads', requireAuth, async (req, res) => {
  try {
    const { title, description, category, city, phone, whatsapp, age, price, images } = req.body;
    
    if (!title || !description || !category || !city || !phone) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    }
    
    const adId = uuidv4();
    const imageUrl = images?.[0] || '';
    
    const { error } = await supabase.from('ads').insert({
      id: adId,
      user_id: req.userId,
      title,
      description,
      category,
      city,
      phone,
      whatsapp: whatsapp || phone,
      age: age || null,
      price: price || null,
      image: imageUrl,
      images: images || [],
      is_active: true,
      views: 0,
      is_premium: false,
      is_verified: false
    });
    
    if (error) throw error;
    
    res.json({ success: true, id: adId });
  } catch (err) {
    console.error('Create ad error:', err);
    res.status(500).json({ error: 'Errore creazione annuncio' });
  }
});

// Elimina annuncio
app.delete('/api/ads/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('ads').delete().eq('id', req.params.id).eq('user_id', req.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Acquisto crediti - crea checkout Stripe
app.post('/api/create-checkout', requireAuth, async (req, res) => {
  try {
    const { credits, price } = req.body;
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `${credits} Crediti Bakeca` },
          unit_amount: price * 100
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${APP_URL}?payment=success&credits=${credits}`,
      cancel_url: `${APP_URL}?payment=cancelled`,
      metadata: { userId: req.userId, credits: credits.toString() }
    });
    
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Errore Stripe' });
  }
});

// ============================================================
// API: ADMIN
// ============================================================

// Middleware admin
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Non autenticato' });
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { data: user } = await supabase.from('profiles').select('role').eq('id', decoded.id).single();
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token non valido' });
  }
};

// Tutti gli utenti
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tutti gli annunci
app.get('/api/admin/ads', requireAdmin, async (req, res) => {
  try {
    const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gestisci utente
app.patch('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { is_premium, is_verified, credits, role } = req.body;
    const updates = {};
    if (typeof is_premium === 'boolean') updates.is_premium = is_premium;
    if (typeof is_verified === 'boolean') updates.is_verified = is_verified;
    if (typeof credits === 'number') updates.credits = credits;
    if (role) updates.role = role;
    
    const { error } = await supabase.from('profiles').update(updates).eq('id', req.params.id);
    if (error) throw error;
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Elimina annuncio (admin)
app.delete('/api/admin/ads/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('ads').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Statistiche admin
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: ads } = await supabase.from('ads').select('*', { count: 'exact', head: true });
    const { count: activeAds } = await supabase.from('ads').select('*', { count: 'exact', head: true }).eq('is_active', true);
    
    res.json({ users: users || 0, ads: ads || 0, activeAds: activeAds || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// AVVIO
// ============================================================
async function start() {
  await initLocalDb();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════╗
║   BAKECA INCONTRI CLONE - Running            ║
╠════════════════════════════════════════════╣
║   🌐 ${APP_URL}
║   🗄️  Supabase Database
║   💳 Stripe Payments
╚════════════════════════════════════════════╝
  `);
  });
}

start();
