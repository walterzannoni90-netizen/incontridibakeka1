import { Router } from "express";
import express from "express";
import Stripe from "stripe";
import { supabase } from "../middleware/supabaseClient";
import { authMiddleware } from "../middleware/auth";
import type { AuthenticatedRequest } from "../types";

const router = Router();

// Inizializza Stripe con la chiave segreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
  typescript: true,
});

const PRICE_MAP: Record<number, { price: number; stripePriceId: string }> = {
  10: { price: 4.99, stripePriceId: process.env.STRIPE_PRICE_10 || "" },
  30: { price: 9.99, stripePriceId: process.env.STRIPE_PRICE_30 || "" },
  70: { price: 19.99, stripePriceId: process.env.STRIPE_PRICE_70 || "" },
  150: { price: 34.99, stripePriceId: process.env.STRIPE_PRICE_150 || "" },
};

// ========== CREATE CHECKOUT SESSION ==========
router.post("/checkout", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { credits } = req.body;

    if (!credits || !PRICE_MAP[credits]) {
      return res.status(400).json({ error: "Pacchetto crediti non valido" });
    }

    const pack = PRICE_MAP[credits];
    const stripePriceId = pack.stripePriceId;

    if (!stripePriceId) {
      return res.status(500).json({ error: "Configurazione Stripe incompleta: manca il Price ID" });
    }

    // Recupera email utente per pre-compilare il checkout
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("id", userId)
      .single();

    // Crea sessione Stripe Checkout direttamente
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/shop?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/shop?payment=cancel`,
      metadata: {
        user_id: userId,
        credits: String(credits),
      },
      client_reference_id: userId,
      customer_email: profile?.email || undefined,
    });

    if (!session.url) {
      return res.status(500).json({ error: "Stripe non ha restituito un URL di checkout" });
    }

    // Salva transazione pending nel DB
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: userId,
      stripe_session_id: session.id,
      amount: pack.price,
      credits,
      status: "pending",
    });

    if (txError) {
      console.error("Errore salvataggio transazione:", txError);
      // Non blocchiamo il checkout, ma logghiamo l'errore
    }

    res.json({ url: session.url, session_id: session.id });
  } catch (error: any) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: error.message || "Errore creazione sessione di pagamento" });
  }
});

// ========== VERIFY PAYMENT STATUS ==========
router.get("/verify/:sessionId", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.userId;

    // Verifica transazione nel DB
    const { data: transaction } = await supabase
      .from("transactions")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .eq("user_id", userId)
      .single();

    if (!transaction) {
      return res.status(404).json({ error: "Transazione non trovata" });
    }

    if (transaction.status === "completed") {
      // Recupera crediti aggiornati
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, has_paid")
        .eq("id", userId)
        .single();

      return res.json({
        status: "completed",
        credits: transaction.credits,
        totalCredits: profile?.credits || 0,
        has_paid: profile?.has_paid || false,
      });
    }

    // Se ancora pending, verifica con Stripe
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        // Aggiorna transazione
        await supabase
          .from("transactions")
          .update({ status: "completed", stripe_payment_id: session.payment_intent as string })
          .eq("stripe_session_id", sessionId);

        // Aggiungi crediti se non già aggiunti
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single();

        const newCredits = (profile?.credits || 0) + transaction.credits;
        await supabase
          .from("profiles")
          .update({ credits: newCredits, has_paid: true })
          .eq("id", userId);

        return res.json({
          status: "completed",
          credits: transaction.credits,
          totalCredits: newCredits,
          has_paid: true,
        });
      }
    } catch (stripeError) {
      console.error("Stripe verify error:", stripeError);
    }

    res.json({ status: transaction.status });
  } catch (error: any) {
    console.error("Verify payment error:", error);
    res.status(500).json({ error: error.message || "Errore verifica pagamento" });
  }
});

// ========== STRIPE WEBHOOK (pubblico, NO auth) ==========
// Express raw body parser per webhook
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error("STRIPE_WEBHOOK_SECRET non configurato");
    return res.status(500).json({ error: "Webhook non configurato" });
  }

  if (!sig) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  console.log(`Webhook ricevuto: ${event.type} - ${event.id}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const creditsStr = session.metadata?.credits;
        const credits = creditsStr ? parseInt(creditsStr, 10) : 0;

        if (!userId || !credits) {
          console.error("Webhook: missing user_id or credits in metadata", session.metadata);
          break;
        }

        // Aggiorna transazione
        await supabase
          .from("transactions")
          .update({
            status: "completed",
            stripe_payment_id: session.payment_intent as string,
          })
          .eq("stripe_session_id", session.id);

        // Aggiungi crediti all'utente
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits, has_paid")
          .eq("id", userId)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              credits: (profile.credits || 0) + credits,
              has_paid: true,
            })
            .eq("id", userId);

          console.log(`Crediti aggiunti: ${credits} all'utente ${userId}`);
        }
        break;
      }

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await supabase
          .from("transactions")
          .update({ status: "failed" })
          .eq("stripe_session_id", session.id);
        console.log(`Transazione fallita: ${session.id}`);
        break;
      }

      default:
        console.log(`Evento non gestito: ${event.type}`);
    }
  } catch (err: any) {
    console.error("Errore processing webhook:", err.message);
    // Ritorniamo 200 per evitare retry di Stripe
  }

  res.json({ received: true });
});

// ========== GET TRANSACTION HISTORY ==========
router.get("/history", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Errore caricamento transazioni" });
    }

    res.json({ transactions: transactions || [] });
  } catch (error: any) {
    console.error("Get history error:", error);
    res.status(500).json({ error: error.message || "Errore interno del server" });
  }
});

export default router;
