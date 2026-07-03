import { useCallback } from "react";

const STRIPE_PUBLISHABLE_KEY = "pk_live_51TnhPkDxJ0tOArXhfg0ZH8uJZOJFG9Hk38XTAK0JUXI1s84R1WzmHD44jDN9hUBRdDM8XNHDdxnKklFZa97j48gi00vd1sqvV1";
const EDGE_FUNCTION_URL = "https://rdqsmfgpbuswzilgbjyr.functions.supabase.co";

// Mapping crediti -> price_id Stripe
const PRICE_IDS: Record<number, string> = {
  10: "price_1TnhPkDxJ0tOArXh0000000a",  // Placeholder - sostituire con veri price_id
  30: "price_1TnhPkDxJ0tOArXh0000000b",
  70: "price_1TnhPkDxJ0tOArXh0000000c",
  150: "price_1TnhPkDxJ0tOArXh0000000d",
};

export function useStripe() {
  const createCheckoutSession = useCallback(
    async (userId: string, credits: number) => {
      try {
        const priceId = PRICE_IDS[credits];
        if (!priceId) {
          throw new Error(`Crediti non supportati: ${credits}`);
        }

        const response = await fetch(
          `${EDGE_FUNCTION_URL}/stripe-checkout`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              price_id: priceId,
              user_id: userId,
              credits: credits,
              success_url: `${window.location.origin}/?payment=success`,
              cancel_url: `${window.location.origin}/?payment=cancel`,
            }),
          }
        );

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        // Salva info sessione
        sessionStorage.setItem("stripeUserId", userId);
        sessionStorage.setItem("stripeCredits", String(credits));

        // Redirect a Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (error) {
        console.error("Errore creazione sessione Stripe:", error);
        throw error;
      }
    },
    []
  );

  const handlePaymentCallback = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");

    if (status === "success") {
      const userId = sessionStorage.getItem("stripeUserId");
      const credits = sessionStorage.getItem("stripeCredits");
      
      // Pulisci sessione
      sessionStorage.removeItem("stripeUserId");
      sessionStorage.removeItem("stripeCredits");

      return { success: true, userId, credits };
    } else if (status === "cancel") {
      return { success: false, message: "Pagamento annullato" };
    }

    return null;
  }, []);

  return {
    createCheckoutSession,
    handlePaymentCallback,
    STRIPE_PUBLISHABLE_KEY,
  };
}
