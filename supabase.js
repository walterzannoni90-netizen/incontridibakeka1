// ============================================================
// SUPABASE CLIENT — Configurazione
// ============================================================
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Polyfill WebSocket per Node.js 20 (necessario per realtime)
if (!globalThis.WebSocket) {
  try {
    globalThis.WebSocket = require('ws');
  } catch (e) {
    // fallback: realtime non disponibile
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rdqsmfgpbuswzilgbjyr.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcXNtZmdwYnVzd3ppbGdianlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzYyMTcsImV4cCI6MjA5ODQxMjIxN30.EthEz46lh_bnJzjpQi9GrXiQsinyb5g47V1p1bwlL_E';

if (!supabaseUrl || supabaseUrl.includes('your-project')) {
  console.warn('⚠️  Supabase non configurato. Usa .env con le tue credenziali.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: false },
  realtime: globalThis.WebSocket ? { transport: globalThis.WebSocket } : undefined
});

module.exports = supabase;
