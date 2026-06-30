// ============================================================
// SUPABASE CLIENT — Configurazione
// ============================================================
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
  console.warn('⚠️  Supabase non configurato. Uso fallback in-memory.');
  console.warn('   Crea .env dal file .env.example con le tue credenziali.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

module.exports = supabase;
