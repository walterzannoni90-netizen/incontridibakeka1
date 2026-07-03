// supabase/functions/stripe-checkout/index.ts
// Edge function: creates a Stripe Checkout Session and a pending transaction record.
import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
interface CheckoutRequestBody {
  price_id?: string;
  user_id?: string;
  credits?: number;
  success_url?: string;
  cancel_url?: string;
}

function validateBody(body: CheckoutRequestBody): string | null {
  if (!body.price_id || typeof body.price_id !== "string") {
    return "Missing or invalid 'price_id'";
  }
  if (!body.user_id || typeof body.user_id !== "string") {
    return "Missing or invalid 'user_id'";
  }
  if (
    typeof body.credits !== "number" ||
    !Number.isInteger(body.credits) ||
    body.credits <= 0
  ) {
    return "Missing or invalid 'credits' (must be a positive integer)";
  }
  if (!body.success_url || typeof body.success_url !== "string") {
    return "Missing or invalid 'success_url'";
  }
  if (!body.cancel_url || typeof body.cancel_url !== "string") {
    return "Missing or invalid 'cancel_url'";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Config check
  if (!STRIPE_SECRET_KEY) {
    return json({ error: "Server missing STRIPE_SECRET_KEY" }, 500);
  }

  let body: CheckoutRequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const validationError = validateBody(body);
  if (validationError) {
    return json({ error: validationError }, 400);
  }

  const { price_id, user_id, credits, success_url, cancel_url } = body;

  // Supabase client (service role) for the transaction record
  let supabase: ReturnType<typeof createClient> | null = null;
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: price_id, quantity: 1 }],
      success_url,
      cancel_url,
      metadata: {
        user_id,
        credits: String(credits),
      },
      client_reference_id: user_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return json({ error: `Failed to create checkout session: ${message}` }, 502);
  }

  // Record a pending transaction (best-effort: does not block the response)
  if (supabase && session.id) {
    try {
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          stripe_session_id: session.id,
          user_id,
          credits,
          amount_total: session.amount_total ?? null,
          currency: session.currency ?? null,
          status: "pending",
        })
        .select()
        .single();

      if (txError) {
        console.error("Failed to insert transaction record:", txError.message);
      }
    } catch (err) {
      console.error(
        "Unexpected error inserting transaction:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  if (!session.url) {
    return json({ error: "Stripe returned no checkout URL" }, 502);
  }

  return json({ url: session.url });
});
