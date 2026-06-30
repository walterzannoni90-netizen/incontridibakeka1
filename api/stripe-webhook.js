// ============================================================
// Stripe Webhook — Gestisce pagamenti completati
// Deploy insieme a create-checkout.js
// ============================================================

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY non configurata');
  }
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rdqsmfgpbuswzilgbjyr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function supabasePost(path, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
}

async function supabasePatch(table, match, data) {
  const q = Object.entries(match).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${q}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || '0');

    if (userId && credits > 0) {
      try {
        // Get current credits
        const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=credits&id=eq.${userId}`, {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          }
        });
        const profiles = await profRes.json();
        const currentCredits = profiles?.[0]?.credits || 0;

        // Update credits
        await supabasePatch('profiles', { id: userId }, { credits: currentCredits + credits });

        // Log transaction
        await supabasePost('credit_transactions', {
          user_id: userId,
          amount: credits,
          type: 'purchase',
          description: `Stripe: acquisto ${credits} crediti`,
          reference_id: session.id
        });

        console.log(`✅ ${credits} crediti aggiunti a ${userId}`);
      } catch (err) {
        console.error('Errore aggiornamento crediti:', err);
      }
    }
  }

  res.json({ received: true });
};
