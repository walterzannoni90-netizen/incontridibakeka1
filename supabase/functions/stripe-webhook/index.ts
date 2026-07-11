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
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          await handleCheckoutCompleted(supabase, session);
        }
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        await handleCheckoutCompleted(
          supabase,
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        await handleCheckoutFailed(supabase, event);
        break;
      }
      default:
        // Unhandled event type — acknowledge with 200 so Stripe doesn't retry
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(
      `Error processing event ${event.type} (${event.id}):`,
      err instanceof Error ? err.message : err,
    );
    // Stripe deve riprovare: complete_stripe_transaction è idempotente.
    return json({ error: "Webhook processing failed" }, 500);
  }

  return json({ received: true });
});

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const sessionId = session.id;
  const paymentIntent = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;

  const { data, error } = await supabase.rpc("complete_stripe_transaction", {
    p_session_id: sessionId,
    p_payment_id: paymentIntent,
  });

  if (error) {
    throw new Error(`complete_stripe_transaction failed: ${error.message}`);
  }

  console.log("Pagamento elaborato in modo idempotente", {
    sessionId,
    result: data,
  });
}

async function handleCheckoutFailed(
  supabase: ReturnType<typeof createClient>,
  event: Stripe.Event,
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const sessionId = session.id;
  const { error } = await supabase
    .from("transactions")
    .update({ status: "failed" })
    .eq("stripe_session_id", sessionId)
    .eq("status", "pending");
  if (error) throw new Error(`Failed to mark transaction failed: ${error.message}`);
  console.log(`checkout failed/expired: session=${sessionId} -> status=failed`);
}
