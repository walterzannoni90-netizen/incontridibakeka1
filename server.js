const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3030;

app.all('/api/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  require('./api/stripe-webhook')(req, res);
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ============================================================
// SUPABASE — Chiavi pubbliche hardcodate (anon key è pubblica)
// ============================================================
const SUPABASE_URL = 'https://rdqsmfgpbuswzilgbjyr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcXNtZmdwYnVzd3ppbGdianlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzYyMTcsImV4cCI6MjA5ODQxMjIxN30.EthEz46lh_bnJzjpQi9GrXiQsinyb5g47V1p1bwlL_E';

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('  🗄️  Database: Supabase PostgreSQL');

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

// --- Auth: Register (usa signUp, funziona con anon key) ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, surname, email, password, city, gender, birthDate, acceptTerms } = req.body;
    if (!name || !email || !password || !acceptTerms) return res.json({ success: false, error: 'Compila tutti i campi obbligatori' });
    if (password.length < 8) return res.json({ success: false, error: 'Password almeno 8 caratteri' });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return res.json({ success: false, error: 'Password deve contenere minuscole, MAIUSCOLE e numeri' });

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, surname } }
    });
    if (error) {
      if (error.message.includes('already')) return res.json({ success: false, error: 'Email già registrata' });
      return res.json({ success: false, error: error.message });
    }
    const uid = data.user.id;
    await supabase.from('profiles').insert({
      id: uid, name, surname: surname || '', city: city || '', gender: gender || '',
      birth_date: birthDate || null, is_verified: false, is_premium: false
    });

    return res.json({
      success: true,
      user: { id: uid, name, email, city: city || '', isVerified: false, isPremium: false },
      token: ''
    });
  } catch (e) { res.json({ success: false, error: 'Errore registrazione' }); }
});

// --- Auth: Login ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ success: false, error: 'Inserisci email e password' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.json({ success: false, error: 'Email o password non validi' });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    return res.json({
      success: true,
      user: {
        id: data.user.id,
        name: profile?.name || data.user.user_metadata?.name || '',
        surname: profile?.surname || '',
        email: data.user.email,
        city: profile?.city || '',
        gender: profile?.gender || '',
        isVerified: !!profile?.is_verified,
        isPremium: !!profile?.is_premium,
        createdAt: data.user.created_at
      },
      token: data.session?.access_token || ''
    });
  } catch (e) { res.json({ success: false, error: 'Errore accesso' }); }
});

// --- Auth: Logout ---
app.post('/api/auth/logout', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) await supabase.auth.signOut().catch(() => {});
  res.json({ success: true });
});

// --- Auth: Me ---
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.json({ success: false, error: 'Non autenticato' });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.json({ success: false, error: 'Non autenticato' });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    return res.json({
      success: true,
      user: {
        id: user.id,
        name: profile?.name || user.user_metadata?.name || '',
        surname: profile?.surname || '',
        email: user.email,
        city: profile?.city || '',
        gender: profile?.gender || '',
        isVerified: !!profile?.is_verified,
        isPremium: !!profile?.is_premium,
        createdAt: user.created_at
      }
    });
  } catch (e) { res.json({ success: false, error: 'Errore' }); }
});

// ============================================================
// AVVIO
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ✦ IncontriDiBakeka — Annunci Premium ✦`);
  console.log(`  ──────────────────────────────────────`);
  console.log(`  🌐  http://0.0.0.0:${PORT}`);
  console.log(`  🗄️  Supabase PostgreSQL`);
  console.log(`  💎  Premium Dating Experience\n`);
});
