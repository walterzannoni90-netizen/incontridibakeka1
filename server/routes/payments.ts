import { Router } from "express";
import { supabase } from "../middleware/supabaseClient";
import { authMiddleware } from "../middleware/auth";
import type { AuthenticatedRequest } from "../types";

const router = Router();

const PRICE_MAP: Record<number, { price: number; stripePriceId: string }> = {
  10: { price: 4.99, stripePriceId: process.env.VITE_STRIPE_PRICE_10 || "" },
  30: { price: 9.99, stripePriceId: process.env.VITE_STRIPE_PRICE_30 || "" },
  70: { price: 19.99, stripePriceId: process.env.VITE_STRIPE_PRICE_70 || "" },
  150: { price: 34.99, stripePriceId: process.env.VITE_STRIPE_PRICE_150 || "" },
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
      return res.status(500).json({ error: "Configurazione Stripe incompleta" });
    }

    // Crea transazione pending
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        amount: pack.price,
        credits,
        status: "pending",
      })
      .select()
      .single();

    if (txError || !transaction) {
      return res.status(500).json({ error: "Errore creazione transazione" });
    }

    // Chiama Supabase Edge Function per creare sessione Stripe
    const edgeFunctionUrl = `${process.env.SUPABASE_URL}/functions/v1/stripe-checkout`;
    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        price_id: stripePriceId,
        user_id: userId,
        credits,
        transaction_id: transaction.id,
        success_url: `${process.env.CLIENT_URL}/shop?payment=success`,
        cancel_url: `${process.env.CLIENT_URL}/shop?payment=cancel`,
      }),
    });

    const data = await response.json();

    if (data.error || !data.url) {
      // Aggiorna transazione come failed
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transaction.id);

      return res.status(500).json({ error: data.error || "Errore creazione sessione Stripe" });
    }

    // Aggiorna transazione con session ID
    await supabase
      .from("transactions")
      .update({ stripe_session_id: data.session_id })
      .eq("id", transaction.id);

    res.json({ url: data.url, session_id: data.session_id });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== VERIFY PAYMENT STATUS ==========
router.get("/verify/:sessionId", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.userId;

    // Verifica transazione
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

    res.json({ status: transaction.status });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
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
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

export default router;
