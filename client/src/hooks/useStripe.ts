import { useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const PRICE_MAP: Record<number, string> = {
  10: "price_1To8sPDxJ0tOArXhsUpAmd4t",
  30: "price_1To8sQDxJ0tOArXhllfiAgT8",
  70: "price_1To8sRDxJ0tOArXhhiUcQJVB",
  150: "price_1To8sRDxJ0tOArXhV5p91wTG",
};

export function useStripe() {
  const createCheckoutSession = useCallback(
    async (_userId: string, credits: number) => {
      try {
        if (!supabase) throw new Error("Supabase non configurato");
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (!user) throw new Error("Devi effettuare il login");

        const priceId = PRICE_MAP[credits];
        if (!priceId) throw new Error("Pacchetto crediti non valido");

        const origin = window.location.origin;
        const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-checkout`, {
          method: "POST",
          // text/plain evita il CORS preflight (simple request)
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            price_id: priceId,
            user_id: user.id,
            credits,
            success_url: `${origin}/shop?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/shop?payment=cancel`,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Errore creazione sessione di pagamento");
        }

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("Stripe non ha restituito un URL di checkout");
        }
      } catch (error) {
        console.error("Errore creazione sessione Stripe:", error);
        throw error;
      }
    },
    []
  );

  const verifyPayment = useCallback(async (sessionId: string) => {
    try {
      if (!supabase) return null;
      const { data: tx } = await supabase
        .from("transactions")
        .select("*")
        .eq("stripe_session_id", sessionId)
        .single();
      if (!tx) return null;
      if (tx.status === "completed") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits, has_paid")
          .eq("id", tx.user_id)
          .single();
        return {
          status: "completed",
          credits: tx.credits,
          totalCredits: profile?.credits ?? 0,
          has_paid: profile?.has_paid ?? false,
        };
      }
      return { status: "pending", credits: tx.credits, totalCredits: 0, has_paid: false };
    } catch (error) {
      console.error("Errore verifica pagamento:", error);
      return null;
    }
  }, []);

  const handlePaymentCallback = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    const sessionId = params.get("session_id");

    if (status === "success" && sessionId) {
      return { success: true, sessionId };
    } else if (status === "cancel") {
      return { success: false, message: "Pagamento annullato" };
    }

    return null;
  }, []);

  return {
    createCheckoutSession,
    verifyPayment,
    handlePaymentCallback,
  };
}
