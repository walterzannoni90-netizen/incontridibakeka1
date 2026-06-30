// ============================================================
// Stripe Webhook — Gestisce eventi Stripe (pagamento completato)
// Deploy: supabase functions deploy stripe-webhook
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.userId
      const credits = session.metadata?.credits || 0

      if (userId && credits > 0) {
        // Aggiorna crediti utente
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single()

        const newCredits = (profile?.credits || 0) + parseInt(credits)
        
        await supabase
          .from('profiles')
          .update({ credits: newCredits })
          .eq('id', userId)

        // Registra transazione
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: parseInt(credits),
            type: 'purchase',
            description: `Stripe: acquisto ${credits} crediti (${session.id})`,
            reference_id: session.id
          })
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    return new Response(err.message, { status: 400 })
  }
})
