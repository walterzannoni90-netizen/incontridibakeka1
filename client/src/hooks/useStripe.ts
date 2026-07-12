import { useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { trackEvent } from "@/lib/analytics";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const VALID_CREDIT_PACKS = new Set([10, 30, 70, 150]);

export function useStripe() {
  const createCheckoutSession = useCallback(
    async (credits: number) => {
      try {
        if (!supabase) throw new Error("Supabase non configurato");

        if (!VALID_CREDIT_PACKS.has(credits)) {
          throw new Error("Pacchetto crediti non valido");
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error("Sessione scaduta: accedi di nuovo");

        void trackEvent("checkout_start", { credits });

        const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-checkout`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ credits }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Errore creazione sessione di pagamento");
        }

        if (data.url) {
          void trackEvent("checkout_created", { credits });
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
