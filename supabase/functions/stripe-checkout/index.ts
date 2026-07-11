import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://incontridibakeka.com";

const PRICE_MAP: Record<number, string | undefined> = {
  10: Deno.env.get("STRIPE_PRICE_10"),
  30: Deno.env.get("STRIPE_PRICE_30"),
  70: Deno.env.get("STRIPE_PRICE_70"),
  150: Deno.env.get("STRIPE_PRICE_150"),
};

function allowedOrigins(): Set<string> {
  const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? SITE_URL)
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return new Set(configured);
}

function corsHeaders(origin: string | null): Record<string, string> {
  const fallbackOrigin = SITE_URL.replace(/\/$/, "");
  return {
    "Access-Control-Allow-Origin": origin ?? fallbackOrigin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin),
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  const requestOrigin = req.headers.get("origin")?.replace(/\/$/, "") ?? null;
  const originAllowed = !requestOrigin || allowedOrigins().has(requestOrigin);

  if (!originAllowed) {
    return json({ error: "Origin non autorizzata" }, 403, null);
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(requestOrigin) });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, requestOrigin);
  }

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Configurazione Stripe o Supabase incompleta");
    return json({ error: "Server non configurato" }, 500, requestOrigin);
  }

  const authMatch = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i);
  if (!authMatch) {
    return json({ error: "Non autorizzato" }, 401, requestOrigin);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(authMatch[1]);
  if (userError || !userData.user) {
    return json({ error: "Token non valido" }, 401, requestOrigin);
  }

  let credits: number;
  try {
    const body = await req.json() as { credits?: unknown };
    credits = Number(body.credits);
  } catch {
    return json({ error: "Body JSON non valido" }, 400, requestOrigin);
  }

  if (!Number.isInteger(credits) || !PRICE_MAP[credits]) {
    return json({ error: "Pacchetto crediti non valido" }, 400, requestOrigin);
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const userId = userData.user.id;
  const baseUrl = SITE_URL.replace(/\/$/, "");

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: PRICE_MAP[credits]!, quantity: 1 }],
      success_url: `${baseUrl}/shop?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/shop?payment=cancel`,
      metadata: {
        user_id: userId,
        credits: String(credits),
      },
      client_reference_id: userId,
      customer_email: userData.user.email,
    });

    if (!session.url) {
      return json({ error: "Stripe non ha restituito un URL" }, 502, requestOrigin);
    }

    const { error: transactionError } = await supabase.from("transactions").insert({
      stripe_session_id: session.id,
      user_id: userId,
      credits,
      amount: session.amount_total === null ? 0 : session.amount_total / 100,
      status: "pending",
    });

    if (transactionError) {
      console.error("Errore creazione transazione:", transactionError.message);
      await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
      return json({ error: "Impossibile registrare la transazione" }, 500, requestOrigin);
    }

    return json({ url: session.url }, 200, requestOrigin);
  } catch (error) {
    console.error("Errore Stripe Checkout:", error instanceof Error ? error.message : error);
    return json({ error: "Impossibile avviare il pagamento" }, 502, requestOrigin);
  }
});
