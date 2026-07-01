// ============================================================
// Stripe Webhook — Supabase Edge Function
// Si attiva quando Stripe conferma un pagamento
// e accredita i crediti all'utente
// ============================================================
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET') || '';
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || '';

const stripe = Stripe(STRIPE_SECRET, { apiVersion: '2023-10-16' });
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Mappa: prezzo -> crediti
const CREDIT_MAP: Record<string, number> = {
  'price_10_credits': 10,
  'price_30_credits': 30,
  'price_70_credits': 70,
  'price_150_credits': 150,
};

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature') || '';
    const body = await req.text();

    // Verifica firma Stripe
    const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.metadata?.user_id;
      const priceId = session.metadata?.price_id || session.line_items?.data?.[0]?.price?.id;
      const credits = CREDIT_MAP[priceId] || session.metadata?.credits
        ? parseInt(session.metadata.credits)
        : 0;

      if (userId && credits > 0) {
        // Aggiungi crediti all'utente
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();

        const newCredits = (profile?.credits || 0) + credits;

        await supabase
          .from('profiles')
          .update({ credits: newCredits })
          .eq('id', userId);

        // Log transazione
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: credits,
            type: 'purchase',
            description: `Acquisto ${credits} crediti via Stripe`,
            stripe_session_id: session.id
          });

        console.log(`✅ ${credits} crediti accreditati a ${userId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
