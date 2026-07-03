// supabase/functions/stripe-webhook/index.ts
// Edge function: receives Stripe webhooks and updates DB state accordingly.
import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// ---------------------------------------------------------------------------
// Headers (webhooks don't need full CORS, but we keep a basic set)
// ---------------------------------------------------------------------------
const headers: Record<string, string> = {
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Config checks
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return json({ error: "Server not configured" }, 500);
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return json({ error: "Server not configured" }, 500);
  }

  // Raw body is required for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return json({ error: "Missing stripe-signature header" }, 400);
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  // Verify the webhook signature
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    console.error("Webhook signature verification failed:", message);
    return json({ error: `Webhook signature verification failed: ${message}` }, 400);
  }

  // Supabase service-role client (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(supabase, event);
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_failed":
      case "checkout.session.failed": {
        await handleCheckoutFailed(supabase, event);
        break;
      }
      default:
        // Unhandled event type — acknowledge with 200 so Stripe doesn't retry
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    // Log but still return 200 to avoid Stripe retries on our processing bugs.
    // Critical DB failures can be reconciled manually.
    console.error(
      `Error processing event ${event.type} (${event.id}):`,
      err instanceof Error ? err.message : err,
    );
  }

  return json({ received: true });
});

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  event: Stripe.Event,
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const sessionId = session.id;

  const userId = session.metadata?.user_id ?? session.client_reference_id ?? null;
  const creditsStr = session.metadata?.credits ?? null;
  const credits = creditsStr ? parseInt(creditsStr, 10) : NaN;

  if (!userId || !Number.isFinite(credits) || credits <= 0) {
    console.error(
      `checkout.session.completed (${sessionId}): missing user_id or credits in metadata`,
      { userId, creditsStr },
    );
    // Still mark the transaction completed so it's not left "pending" forever.
    await safeUpdateTransaction(supabase, sessionId, "completed");
    return;
  }

  // 1. Update the transaction status -> completed
  await safeUpdateTransaction(supabase, sessionId, "completed");

  // 2. Increment profile credits and set has_paid = true
  const { error: profileError } = await supabase.rpc("increment_credits", {
    p_user_id: userId,
    p_credits: credits,
  });

  if (profileError) {
    // Fallback: manual update if the RPC doesn't exist
    console.warn(
      "increment_credits RPC failed, falling back to direct update:",
      profileError.message,
    );
    const { data: profile, error: fetchErr } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (fetchErr) {
      console.error(`Failed to fetch profile ${userId}:`, fetchErr.message);
    } else {
      const newCredits = (profile?.credits ?? 0) + credits;
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ credits: newCredits, has_paid: true })
        .eq("id", userId);
      if (updErr) {
        console.error(`Failed to update profile ${userId}:`, updErr.message);
      }
    }
  } else {
    // Ensure has_paid is set even if the RPC only touched credits
    const { error: paidErr } = await supabase
      .from("profiles")
      .update({ has_paid: true })
      .eq("id", userId);
    if (paidErr) {
      console.error(`Failed to set has_paid for ${userId}:`, paidErr.message);
    }
  }

  console.log(
    `checkout.session.completed: user=${userId} credits=+${credits} session=${sessionId}`,
  );
}

async function handleCheckoutFailed(
  supabase: ReturnType<typeof createClient>,
  event: Stripe.Event,
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const sessionId = session.id;
  await safeUpdateTransaction(supabase, sessionId, "failed");
  console.log(`checkout failed/expired: session=${sessionId} -> status=failed`);
}

async function safeUpdateTransaction(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  status: "completed" | "failed",
): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("stripe_session_id", sessionId);

  if (error) {
    console.error(
      `Failed to update transaction ${sessionId} -> ${status}:`,
      error.message,
    );
  }
}
