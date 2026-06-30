// ============================================================
// Stripe Checkout — Serverless Function (Vercel/Netlify)
// Deploy: 
//   Vercel: vercel --prod
//   Netlify: ntl deploy --prod
// ============================================================

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY non configurata');
  }
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = getStripe();
    const { amount, credits, userId, successUrl, cancelUrl } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ error: 'Missing amount or userId' });
    }

    // Price mapping: credits amount -> Stripe Price ID
    const priceMap = {
      10: process.env.STRIPE_PRICE_10 || 'price_10credits',
      30: process.env.STRIPE_PRICE_30 || 'price_30credits',
      70: process.env.STRIPE_PRICE_70 || 'price_70credits',
      150: process.env.STRIPE_PRICE_150 || 'price_150credits',
    };

    // Option 1: Use Price ID if configured
    let sessionParams = {
      mode: 'payment',
      client_reference_id: userId,
      metadata: { userId, credits: String(credits) },
      success_url: successUrl || 'https://incontridibakeka.com/?payment=success',
      cancel_url: cancelUrl || 'https://incontridibakeka.com/?shop=cancelled',
    };

    if (priceMap[amount]) {
      sessionParams.line_items = [{ price: priceMap[amount], quantity: 1 }];
    } else {
      // Option 2: Dynamic amount (in EUR cents)
      const euroAmount = { 10: 499, 30: 999, 70: 1999, 150: 3499 }[amount] || amount * 50;
      sessionParams.line_items = [{
        price_data: {
          currency: 'eur',
          product_data: { name: `${credits} crediti IncontriDiBakeka` },
          unit_amount: euroAmount,
        },
        quantity: 1,
      }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message });
  }
};
