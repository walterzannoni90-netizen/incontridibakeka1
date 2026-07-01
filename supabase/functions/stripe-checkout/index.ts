// ============================================================
// Stripe Checkout — Crea una sessione di pagamento
// POST: { price_id: string, user_id: string, credits: number }
// Ritorna: { url: string }
// ============================================================
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET') || '';

const stripe = Stripe(STRIPE_SECRET, { apiVersion: '2023-10-16' });

serve(async (req) => {
  try {
    const { price_id, user_id, credits, success_url, cancel_url } = await req.json();

    if (!price_id || !user_id) {
      return new Response(JSON.stringify({ error: 'price_id e user_id richiesti' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: price_id, quantity: 1 }],
      metadata: { user_id, credits: String(credits || 0) },
      success_url: success_url ||
        'https://incontridibakeka.com/?payment=success',
      cancel_url: cancel_url ||
        'https://incontridibakeka.com/?payment=cancel',
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
